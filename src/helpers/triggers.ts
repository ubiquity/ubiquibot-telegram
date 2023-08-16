import { ApiParam, DataType } from "../types/Basic";

/**
 * Return url to telegram api, optionally with parameters added
 */
export const apiUrl = (methodName: string, params: ApiParam | null) => {
  let query = "";
  if (params !== null) {
    query = "?" + new URLSearchParams(params.toString()).toString();
  }
  return `https://api.telegram.org/bot${process.env.TOKEN}/${methodName}${query}`;
};

/**
 * Answer callback query (inline button press)
 * This stops the loading indicator on the button and optionally shows a message
 * https://core.telegram.org/bots/api#sendmessage
 */
export const answerCallbackQuery = async (callbackQueryId: number, text: string | null) => {
  const data: DataType = {
    callback_query_id: callbackQueryId,
  };
  if (text !== null) {
    data.text = text;
  }
  return (await fetch(apiUrl("answerCallbackQuery", data))).json();
};

/**
 * Send text message formatted with MarkdownV2-style
 * Keep in mind that any markdown characters _*[]()~`>#+-=|{}.! that
 * are not part of your formatting must be escaped. Incorrectly escaped
 * messages will not be sent. See escapeMarkdown()
 * https://core.telegram.org/bots/api#sendmessage
 */
export const sendReply = async (chatId: number, messageId: number, text: string) => {
  return (
    await fetch(
      apiUrl("sendMessage", {
        chat_id: chatId,
        text,
        parse_mode: "MarkdownV2",
        reply_to_message_id: messageId,
        reply_markup: JSON.stringify({
          inline_keyboard: [
            [
              {
                text: "Reject",
                callback_data: `reject_task`,
              },
              {
                text: "Create Task",
                callback_data: `create_task`,
              },
            ],
          ],
        }),
      })
    )
  ).json();
};

export const editBotMessage = async (chatId: number, messageId: number, newText: string) => {
  try {
    const response = await fetch(
      apiUrl("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: newText,
        parse_mode: "MarkdownV2",
      })
    );
    return response.json();
  } catch (error) {
    console.error("Error editing message:", error);
    return null;
  }
};

export const deleteBotMessage = async (chatId: number, messageId: number, newText?: string) => {
  try {
    const response = await fetch(
      apiUrl("deleteMessage", {
        chat_id: chatId,
        message_id: messageId,
      })
    );
    return response.json();
  } catch (error) {
    console.error("Error deleting message:", error);
    return null;
  }
};

export default {
  deleteBotMessage,
  editBotMessage,
  sendReply,
  answerCallbackQuery,
  apiUrl,
};
