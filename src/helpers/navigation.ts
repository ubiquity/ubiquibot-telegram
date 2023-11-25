import { ENABLE_TOPIC } from "../constants";
import { CallbackQueryType, KeyboardDataType } from "../types/Basic";

import { setUserSession } from "./session";
import { getForumById, getForums, hasEnabledForum } from "./supabase";
import { getGroupDetails, listGroupsWithBot } from "./telegram";
import { editBotMessage, replyMessage } from "./triggers";
import { parseCallData } from "./utils";

export async function handleFirstMenu(value: string, chatId: number, messageId: number, groupKey: string, groupData: string) {
  switch (value) {
    case "link_github":
      await editBotMessage(chatId, messageId, `Please provide the URL of repository you want to link to this ${groupKey}.`);
      await setUserSession(chatId, { v: "link_github", c: groupData, k: groupKey });
      break;
    default:
      break;
  }
}

/**
 * Handle incoming callback_query (inline button press)
 * https://core.telegram.org/bots/api#message
 */
export async function onPrivateCallbackQuery(callbackQuery: CallbackQueryType) {
  type ActionKeys = "group" | "menu" | "group_list" | "forum";

  const parsedData = parseCallData(callbackQuery.data);
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const fromId = callbackQuery.from.id;

  const item = parsedData[parsedData.length - 1]; // select the last calldata

  const keyboardMainMenuRes: KeyboardDataType[] = [
    {
      text: "Link Github Repo",
      callback_data: `${callbackQuery.data},menu:link_github`,
    },
  ];

  // Use the item.key and item.value to generate menu items
  const actions: {
    [K in ActionKeys]: () => Promise<void>;
  } = {
    async group() {
      const { name, is_forum } = await getGroupDetails(Number(item.value));
      const hasForums = await hasEnabledForum(Number(item.value));
      // rest of your code...
      if (is_forum && !hasForums) {
        return await editBotMessage(
          chatId,
          messageId,
          `This group has topics enabled. Please use the ${ENABLE_TOPIC} command on the topics you want to work with to see them here.`
        );
      } else if (is_forum && hasForums) {
        // list topics
        const forumList = await getForums(Number(item.value));

        if (forumList && forumList.length > 0) {
          const keyboardRes: KeyboardDataType[] = forumList.map((e) => ({
            text: e.forum_name,
            callback_data: `${callbackQuery.data},forum:${e.id}`,
          }));

          // add general topic to list
          keyboardRes.unshift({
            text: "General",
            callback_data: `${callbackQuery.data},forum:${item.value}`,
          });

          return messageId
            ? await editBotMessage(chatId, messageId, "Choose a topic from the list below:", keyboardRes)
            : await replyMessage(chatId, "Choose a topic from the list below:", keyboardRes);
        }
        return;
      }

      await editBotMessage(chatId, messageId, `Here is your group: *${name}* \nWhat do you want to do?`, keyboardMainMenuRes);
    },
    async menu() {
      // fetch all keys and get the one with key as forum, if none, then find the one with group
      const groupData = parsedData.find((e) => e.key === "group") as { key: ActionKeys; value: string };
      const forumData = parsedData.find((e) => e.key === "forum") as { key: ActionKeys; value: string };

      const data = forumData ? forumData : groupData;
      await handleFirstMenu(item.value as string, chatId, messageId, data.key, data.value as string);
    },
    async group_list() {
      await listGroupsWithBot(fromId, chatId, messageId);
    },
    async forum() {
      if (item.value.toString().startsWith("-")) {
        return await editBotMessage(chatId, messageId, `Here is your topic: *General* \nWhat do you want to do?`, keyboardMainMenuRes);
      }
      const forum = await getForumById(Number(item.value));
      await editBotMessage(chatId, messageId, `Here is your topic: *${forum.forum_name}* \nWhat do you want to do?`, keyboardMainMenuRes);
    },
  };

  if (actions[item.key as ActionKeys]) {
    await actions[item.key as ActionKeys]();
  } else {
    console.log(`Unknown key: ${item.key}`);
  }
}
