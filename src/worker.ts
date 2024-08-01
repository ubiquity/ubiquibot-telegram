/**
 * All console.log for debugging the worker on cloudflare dashboard
 */

import { BOT_COMMANDS, ENABLE_TOPIC, GITHUB_PATHNAME } from "./constants";
import { completeGpt3 } from "./helpers/chat-gpt";
import { createIssue } from "./helpers/github";
import { onPrivateCallbackQuery } from "./helpers/navigation";
import { oAuthHandler } from "./helpers/oauth-login";
import { getForum, getUserGithubId, getUserGithubToken } from "./helpers/supabase";
import { changeForumName, getBotUsername, handleSlashCommand, isAdminOfChat, isBotAdded, isBotRemoved } from "./helpers/telegram";
import { answerCallbackQuery, apiUrl, deleteBotMessage, editBotMessage, sendReply } from "./helpers/triggers";
import {
  cleanMessage,
  escapeMarkdown,
  extractTag,
  extractTaskInfo,
  generateMessageLink,
  getRepoData,
  isCoolDownReady,
  removeTag,
  setLastAnalysisTimestamp,
  slashCommandCheck,
} from "./helpers/utils";
import { sendLogsToGroup } from "./helpers/webhook";
import { CallbackQueryType, ExtendableEventType, FetchEventType, MessageType, MyChatQueryType, UpdateType } from "./types/telegram";

/**
 * Wait for requests to the worker
 */
addEventListener("fetch", async (event: Event) => {
  const ev = event as FetchEventType;
  const url = new URL(ev.request.url);
  if (url.pathname === WEBHOOK) {
    await ev.respondWith(handleWebhook(ev as ExtendableEventType, url));
  } else if (url.pathname === GITHUB_PATHNAME) {
    await ev.respondWith(oAuthHandler(ev as ExtendableEventType, url));
  } else if (url.pathname === "/registerWebhook") {
    await ev.respondWith(registerWebhook(url, WEBHOOK || "", SECRET || ""));
  } else if (url.pathname === "/unRegisterWebhook") {
    await ev.respondWith(unRegisterWebhook());
  } else if (url.pathname === "/setCommands") {
    await ev.respondWith(setCommands());
  } else if (url.pathname === "/sendLogs") {
    await ev.respondWith(sendLogsToGroup(ev as ExtendableEventType));
  } else {
    await ev.respondWith(new Response("No handler for this request"));
  }
});

/**
 * Handle requests to WEBHOOK
 * https://core.telegram.org/bots/api#update
 */
async function handleWebhook(event: ExtendableEventType, url: URL) {
  // Check secret
  if (event.request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== SECRET) {
    return new Response("Unauthorized", { status: 403 });
  }

  // Read request body synchronously
  const update = await event.request.json();
  // Deal with response asynchronously
  event.waitUntil(onUpdate(update, url));

  return new Response("Ok");
}

/**
 * Handle incoming Update
 * supports messages and callback queries (inline button presses)
 * https://core.telegram.org/bots/api#update
 */
async function onUpdate(update: UpdateType, url: URL) {
  console.log(update);
  if ("message" in update || "channel_post" in update) {
    try {
      await onMessage(update.message || update.channel_post, url);
    } catch (e) {
      console.log(e);
    }
  }

  if ("callback_query" in update) {
    const isPrivate = update.callback_query.message.chat.type === "private";
    if (isPrivate) {
      await onPrivateCallbackQuery(update.callback_query);
    } else {
      await onCallbackQuery(update.callback_query);
    }
  }

  if ("my_chat_member" in update) {
    // queries to run on installation and removal
    await onBotInstall(update.my_chat_member);
  }
}

/**
 * Set webhook to this worker's url
 * https://core.telegram.org/bots/api#setwebhook
 */
async function registerWebhook(requestUrl: URL, suffix: string, secret: string) {
  // https://core.telegram.org/bots/api#setwebhook
  const webhookUrl = `${requestUrl.protocol}//${requestUrl.hostname}${suffix}`;
  const r = await (await fetch(apiUrl("setWebhook", { url: webhookUrl, secret_token: secret }))).json();
  return new Response("ok" in r && r.ok ? "Ok" : JSON.stringify(r, null, 2));
}

/**
 * Set commands
 * https://core.telegram.org/bots/api#setmycommands
 */
async function setCommands() {
  const r = await fetch(apiUrl("setMyCommands", {}), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      commands: BOT_COMMANDS,
      scope: { type: "default" },
      language_code: "en",
    }),
  });
  return new Response("ok" in r && r.ok ? "Ok" : JSON.stringify(r, null, 2));
}

/**
 * Remove webhook
 * https://core.telegram.org/bots/api#setwebhook
 */
async function unRegisterWebhook() {
  const r = await (await fetch(apiUrl("setWebhook", { url: "" }))).json();
  await setCommands();
  return new Response("ok" in r && r.ok ? "Ok" : JSON.stringify(r, null, 2));
}

async function onBotInstall(event: MyChatQueryType) {
  const status = event.new_chat_member.status;
  const previousStatus = event.old_chat_member.status;
  const triggerUserName = event.new_chat_member.user.username;
  const chatId = event.chat.id;
  const fromId = event.from.id;
  const groupName = event.chat.title;

  const botName = await getBotUsername();

  console.log(status, chatId, fromId, groupName);

  if (botName === triggerUserName) {
    // true if this is a valid bot install and uninstall
    switch (status) {
      case "kicked":
        await isBotRemoved(chatId, fromId);
        break;
      case "left":
        await isBotRemoved(chatId, fromId);
        break;
      case "member":
        await isBotAdded(chatId, fromId, groupName, previousStatus);
        break;
      case "added":
        await isBotAdded(chatId, fromId, groupName, previousStatus);
        break;
      case "administrator":
        await isBotAdded(chatId, fromId, groupName, previousStatus);
        break;
      default:
        break;
    }
  }
}

/**
 * Handle incoming callback_query (inline button press)
 * https://core.telegram.org/bots/api#message
 */
async function onCallbackQuery(callbackQuery: CallbackQueryType) {
  const clickerId = callbackQuery.from.id;
  const clickerUsername = callbackQuery.from.username;
  const creatorsUsername = callbackQuery.message.reply_to_message.from.username;
  const groupId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const messageIdReply = callbackQuery.message.reply_to_message.message_id;
  const messageText = callbackQuery.message.text;
  const replyToMessage = callbackQuery.message.reply_to_message.text;

  const isAdmin = await isAdminOfChat(clickerId, groupId);
  if (!isAdmin && clickerUsername !== creatorsUsername) {
    return answerCallbackQuery(callbackQuery.id, "You are not the creator of this task or an admin");
  }

  const token = await getUserGithubToken(creatorsUsername, groupId);

  if (callbackQuery.data === "create_task") {
    await handleCreateTask(callbackQuery, messageIdReply, groupId, messageText, replyToMessage, token);
  } else if (callbackQuery.data === "reject_task") {
    await deleteBotMessage(groupId, messageId);
  }
}

async function handleCreateTask(
  callbackQuery: CallbackQueryType,
  messageIdReply: number,
  groupId: number,
  messageText: string,
  replyToMessage: string,
  token: string
) {
  const messageLink = generateMessageLink(messageIdReply, groupId);
  const { title, timeEstimate, orgName, repoName } = extractTaskInfo(messageText);

  if (!title || !timeEstimate) {
    console.log(`Task title is null`);
    return;
  }

  if (!repoName || !orgName) {
    console.log(`No Github data mapped to chat`);
    return;
  }

  const tagged = extractTag(replyToMessage);
  let githubId;

  if (tagged) {
    githubId = await getUserGithubId(tagged, groupId);
    if (!githubId) {
      await sendReply(groupId, messageIdReply, escapeMarkdown(`User *${tagged}* does not have a Github account linked`, "*`[]()@/"), true);
    }
  }

  const tagFreeTitle = removeTag(replyToMessage);
  const { data, assignees, error } = await createIssue(timeEstimate, orgName, repoName, title, tagFreeTitle, messageLink, githubId || -1, token);

  let msg = data.html_url
    ? `*Issue created: [Check it out here](${data.html_url})* with time estimate *${timeEstimate}*`
    : `Error creating issue on *${orgName}/${repoName}*, Details: *${error || data.message}*`;

  if (data.html_url && assignees) {
    msg += ` and @${tagged} as assignee`;
  }

  await editBotMessage(groupId, callbackQuery.message.message_id, msg);
  return answerCallbackQuery(callbackQuery.id, "issue created!");
}

/**
 * Handle incoming Message
 * https://core.telegram.org/bots/api#message
 */
async function onMessage(message: MessageType, url: URL) {
  console.log(`Received message: ${message.text}`);

  if (message.forum_topic_edited) {
    await handleForumTopicEdited(message);
    return;
  }

  if (!message.text) {
    console.log(`Skipping, no message attached`);
    return;
  }

  const isSlash = slashCommandCheck(message.text);
  const isPrivate = message.chat.type === "private";
  const chatId = message.chat.id;
  const fromId = message.from.id;
  const username = message.from.username;
  const messageId = message.message_id;
  const forumName = message?.reply_to_message?.forum_topic_created?.name;
  const threadId = message?.reply_to_message?.message_thread_id || message?.message_thread_id;

  if (isPrivate || isSlash) {
    return handleSlashCommand(isPrivate, isSlash, message.text, fromId, chatId, username, url, messageId, forumName, threadId);
  }

  if (!isCoolDownReady()) {
    console.log(`Skipping, bot on cool down`);
    return;
  }

  const msgText = cleanMessage(message.text);
  if (msgText === "") {
    console.log(`Skipping, message is empty`);
    console.log(message);
    return;
  }

  const gpt3Info = await completeGpt3(msgText);
  if (!gpt3Info || !gpt3Info.issueTitle) {
    console.log(`No valid task found`);
    return;
  }

  await handleGpt3Info(gpt3Info, chatId, messageId, forumName);
}

async function handleForumTopicEdited(message: MessageType) {
  await changeForumName({
    newForumName: message.forum_topic_edited.name,
    threadId: message.message_thread_id,
    chatId: message.chat.id,
    fromId: message.from.id,
  });
}

async function handleGpt3Info(
  gpt3Info: {
    issueTitle: string | null;
    timeEstimate: string | null;
  },
  chatId: number,
  messageId: number,
  forumName: string
) {
  const { issueTitle, timeEstimate } = gpt3Info;

  if (forumName) {
    const res = await getForum(chatId, forumName);
    if (!res || !res.enabled) {
      console.log(`Skipping, topic not enabled`);
      return sendReply(chatId, messageId, escapeMarkdown(`Topic not enabled, please use the ${ENABLE_TOPIC} command to enable`, "*`[]()@/"), true);
    }
  }

  setLastAnalysisTimestamp(Date.now());

  const { repoName, orgName } = await getRepoData(chatId, forumName);
  if (!repoName || !orgName) {
    console.log(`No Github data mapped to chat`);
    return sendReply(
      chatId,
      messageId,
      escapeMarkdown(`No Github mapped to this chat, please use the /start command in private chat to set this up`, "*`[]()@/"),
      true
    );
  }

  if (issueTitle) {
    return sendReply(chatId, messageId, escapeMarkdown(`*"${issueTitle}"* on *${orgName}/${repoName}* with time estimate *${timeEstimate}*`, "*`[]()@/"));
  }
}
