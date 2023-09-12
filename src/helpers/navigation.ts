import { ENABLE_TOPIC } from "../constants";
import { CallbackQueryType, KeyboardDataType } from "../types/Basic";

import { setUserSession } from "./session";
import { getTopics, hasEnabledTopic } from "./supabase";
import { getGroupDetails, listGroupsWithBot } from "./telegram";
import { editBotMessage, replyMessage } from "./triggers";
import { parseCallData } from "./utils";

export const handleFirstMenu = async (value: string, chatId: number, messageId: number, groupData: string) => {
  switch (value) {
    case "link_github":
      await editBotMessage(chatId, messageId, `Please provide the URL of repository you want to link to this group.`);
      await setUserSession(chatId, { v: "link_github", c: groupData });
      break;
    default:
      break;
  }
};

/**
 * Handle incoming callback_query (inline button press)
 * https://core.telegram.org/bots/api#message
 */
export const onPrivateCallbackQuery = async (callbackQuery: CallbackQueryType) => {
  const parsedData = parseCallData(callbackQuery.data);
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const fromId = callbackQuery.from.id;

  const item = parsedData[parsedData.length - 1]; // select the last calldata

  // Use the item.key and item.value to generate menu items
  switch (item.key) {
    case "group":
      const { name, is_forum } = await getGroupDetails(item.value as number);
      const hasTopics = await hasEnabledTopic(item.value as number)

      if (is_forum && !hasTopics) {
        return await editBotMessage(chatId, messageId, `This group is a forum. Please use the ${ENABLE_TOPIC} command on the forums you want to work with to see them here.`);
      } else if (is_forum && hasTopics) {
        // list topics
        const topicList = await getTopics(item.value as number);
        
        if (topicList && topicList.length > 0) {
          // add general topic to list
          topicList.push({
            text: "General",
            callback_data: `forum:general`,
          })

          const keyboardRes: KeyboardDataType[] = topicList.map((e) => ({
            text: e.forum_name,
            callback_data: `forum:${e.id}`,
          }));
          return messageId
            ? await editBotMessage(chatId, messageId, "Choose a topic from the list below:", keyboardRes)
            : await replyMessage(chatId, "Choose a group from the list below:", keyboardRes);
        }
        return;
      }

      await editBotMessage(chatId, messageId, `Here is your group: *${name}* \nWhat do you want to do?`, [
        {
          text: "Link Github Repo",
          callback_data: `${callbackQuery.data},menu:link_github`,
        },
      ]);
      break;
    case "menu":
      const groupData = parsedData[0];
      await handleFirstMenu(item.value as string, chatId, messageId, groupData.value as string);
      break;
    case "group_list":
      await listGroupsWithBot(fromId, chatId, messageId);
      break;
    default:
      console.log(`Unknown key: ${item.key}`);
      break;
  }
};
