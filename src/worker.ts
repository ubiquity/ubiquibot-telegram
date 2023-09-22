/**
 * All console.log for debugging the worker on cloudflare dashboard
 */

import { BOT_COMMANDS, ENABLE_TOPIC, GITHUB_PATHNAME } from "./constants";
import { completeGPT3 } from "./helpers/chatGPT";
import { createIssue } from "./helpers/github";
import { onPrivateCallbackQuery } from "./helpers/navigation";
import { OAuthHandler } from "./helpers/oauth-login";
import { getTopic, getUserGithubId, getUserGithubToken } from "./helpers/supabase";
import { changeForumName, getBotUsername, handleSlashCommand, isAdminOfChat, isBotAdded, isBotRemoved } from "./helpers/telegram";
import { answerCallbackQuery, apiUrl, deleteBotMessage, editBotMessage, sendReply } from "./helpers/triggers";
import {
  cleanMessage,
  isCooldownReady,
  setLastAnalysisTimestamp,
  escapeMarkdown,
  extractTag,
  extractTaskInfo,
  generateMessageLink,
  getRepoData,
  removeTag,
  slashCommandCheck,
} from "./helpers/utils";
import { CallbackQueryType, ExtendableEventType, FetchEventType, MessageType, MyChatQueryType, UpdateType } from "./types/Basic";

/**
 * Wait for requests to the worker
 */
addEventListener("fetch", async (event: Event) => {
  const ev = event as FetchEventType;
  const url = new URL(ev.request.url);
  if (url.pathname === WEBHOOK) {
    await ev.respondWith(handleWebhook(ev as ExtendableEventType, url));
  } else if (url.pathname === GITHUB_PATHNAME) {
    await ev.respondWith(OAuthHandler(ev as ExtendableEventType, url));
  } else if (url.pathname === "/registerWebhook") {
    await ev.respondWith(registerWebhook(url, WEBHOOK || "", SECRET || ""));
  } else if (url.pathname === "/unRegisterWebhook") {
    await ev.respondWith(unRegisterWebhook());
  } else if (url.pathname === "/setCommands") {
    await ev.respondWith(setCommands());
  } else {
    await ev.respondWith(new Response("No handler for this request"));
  }
});

/**
 * Handle requests to WEBHOOK
 * https://core.telegram.org/bots/api#update
 */
const handleWebhook = async (event: ExtendableEventType, url: URL) => {
  // Check secret
  if (event.request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== SECRET) {
    return new Response("Unauthorized", { status: 403 });
  }

  // Read request body synchronously
  const update = await event.request.json();
  // Deal with response asynchronously
  event.waitUntil(onUpdate(update, url));

  return new Response("Ok");
};

/**
 * Handle incoming Update
 * supports messages and callback queries (inline button presses)
 * https://core.telegram.org/bots/api#update
 */
const onUpdate = async (update: UpdateType, url: URL) => {
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
};

/**
 * Set webhook to this worker's url
 * https://core.telegram.org/bots/api#setwebhook
 */
const registerWebhook = async (requestUrl: URL, suffix: string, secret: string) => {
  // https://core.telegram.org/bots/api#setwebhook
  const webhookUrl = `${requestUrl.protocol}//${requestUrl.hostname}${suffix}`;
  const r = await (await fetch(apiUrl("setWebhook", { url: webhookUrl, secret_token: secret }))).json();
  return new Response("ok" in r && r.ok ? "Ok" : JSON.stringify(r, null, 2));
};

/**
 * Set commands
 * https://core.telegram.org/bots/api#setmycommands
 */
const setCommands = async () => {
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
};

/**
 * Remove webhook
 * https://core.telegram.org/bots/api#setwebhook
 */
const unRegisterWebhook = async () => {
  const r = await (await fetch(apiUrl("setWebhook", { url: "" }))).json();
  await setCommands();
  return new Response("ok" in r && r.ok ? "Ok" : JSON.stringify(r, null, 2));
};

const onBotInstall = async (event: MyChatQueryType) => {
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
};

/**
 * Handle incoming callback_query (inline button press)
 * https://core.telegram.org/bots/api#message
 */
async function onCallbackQuery(callbackQuery: CallbackQueryType) {
  const clickerId = callbackQuery.from.id; // id of user who clicked the button
  const clickerUsername = callbackQuery.from.username; // Username of user who clicked the button
  const creatorsUsername = callbackQuery.message.reply_to_message.from.username; // Creator's username
  const groupId = callbackQuery.message.chat.id; // group id
  const messageId = callbackQuery.message.message_id; // id for current message
  const messageIdReply = callbackQuery.message.reply_to_message.message_id; // id of root message
  const messageText = callbackQuery.message.text; // text of current message
  const replyToMessage = callbackQuery.message.reply_to_message.text; // text of root message

  const isAdmin = await isAdminOfChat(clickerId, groupId);
  // clicker needs to be the creator or admin
  if (!isAdmin && clickerUsername !== creatorsUsername) {
    return answerCallbackQuery(callbackQuery.id, "You are not the creator of this task or an admin");
  }

  // get users token if available
  const token = await getUserGithubToken(creatorsUsername, groupId);

  if (callbackQuery.data === "create_task") {
    // get message link
    const messageLink = generateMessageLink(messageIdReply, groupId);

    const { title, timeEstimate, orgName, repoName } = extractTaskInfo(messageText);

    if (title === null || timeEstimate === null) {
      console.log(`Task title is null`);
      return;
    }

    console.log(`Check: ${title}, ${timeEstimate} ${orgName}:${repoName}`);

    if (!repoName || !orgName) {
      console.log(`No Github data mapped to chat`);
      return;
    }

    // get tagged user if available
    const tagged = extractTag(replyToMessage);
    let github_id;

    if (tagged) {
      github_id = await getUserGithubId(tagged, groupId);
      console.log("Tagged user found:", github_id);

      !github_id && (await sendReply(groupId, messageId, escapeMarkdown(`User *${tagged}* does not have a Github account linked`, "*`[]()@/"), true));
    }

    // remove tag from issue body
    const tagFreeTitle = removeTag(replyToMessage);

    const { data, assignees, error } = await createIssue(timeEstimate || "", orgName, repoName, title || "", tagFreeTitle, messageLink, github_id || -1, token);

    console.log(`Issue created: ${data.html_url} ${data.message}`);

    const msg = data.html_url
      ? `*Issue created: [Check it out here](${data.html_url})* with time estimate *${timeEstimate}*${assignees ? ` and @${tagged} as assignee` : ""}`
      : `Error creating issue on *${orgName}/${repoName}*, Details: *${error || data.message}*`;

    await editBotMessage(groupId, messageId, msg);
    return answerCallbackQuery(callbackQuery.id, "issue created!");
  } else if (callbackQuery.data === "reject_task") {
    await deleteBotMessage(groupId, messageId);
  }
}

/**
 * Handle incoming Message
 * https://core.telegram.org/bots/api#message
 */
const onMessage = async (message: MessageType, url: URL) => {
  console.log(`Received message: ${message.text}`);

  if (message.forum_topic_edited) {
    await changeForumName(message.forum_topic_edited.name, message.message_thread_id, message.chat.id, message.from.id);
  }

  if (!message.text) {
    console.log(`Skipping, no message attached`);
    return;
  }

  // HANDLE SLASH HANDLERS HERE
  const isSlash = slashCommandCheck(message.text);
  const isPrivate = message.chat.type === "private";
  const chatId = message.chat.id;
  const fromId = message.from.id; // get caller id
  const username = message.from.username;
  const messageId = message.message_id;
  const forumName = message?.reply_to_message?.forum_topic_created?.name;
  const threadId = message?.reply_to_message?.message_thread_id || message?.message_thread_id;

  if (isPrivate) {
    return handleSlashCommand(isPrivate, isSlash, message.text, fromId, chatId, username, url, messageId, forumName, threadId);
  } else if (isSlash) {
    return handleSlashCommand(isPrivate, isSlash, message.text, fromId, chatId, username, url, messageId, forumName, threadId);
  }

  // Check if cooldown
  const isReady = isCooldownReady();

  if (!isReady) {
    console.log(`Skipping, bot on cooldown`);
    return;
  }

  const msgText = cleanMessage(message.text);

  if (msgText === "") {
    console.log(`Skipping, message is empty`);
    console.log(message);
    return;
  }

  // Analyze the message with ChatGPT
  const GPT3Info = await completeGPT3(msgText);

  if (GPT3Info == undefined || GPT3Info.issueTitle == null) {
    console.log(`No valid task found`);
    return;
  }

  const { issueTitle, timeEstimate } = GPT3Info;

  if (forumName) {
    const res = await getTopic(chatId, forumName);
    if (!res || !res.enabled) {
      console.log(`Skipping, topic not enabled`);
      return sendReply(chatId, messageId, escapeMarkdown(`Topic not enabled, please use the ${ENABLE_TOPIC} command to enable`, "*`[]()@/"), true);
    }
  }

  // Update the last analysis timestamp upon successful analysis
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
};
