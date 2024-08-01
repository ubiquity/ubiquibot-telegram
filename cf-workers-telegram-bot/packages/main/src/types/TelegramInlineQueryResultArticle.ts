import TelegramInlineQueryResult from "./TelegramInlineQueryResult.js";
import TelegramInputMessageContent from "./TelegramInputMessageContent.js";

export default class TelegramInlineQueryResultArticle extends TelegramInlineQueryResult {
  title: string;
  input_message_content: TelegramInputMessageContent;
  thumb_url: string;
  constructor(content: string, title = content, parse_mode = "", thumb_url = "") {
    super("article");
    this.title = title;
    this.input_message_content = {
      message_text: content.toString(),
      parse_mode,
    };
    this.thumb_url = thumb_url;
  }
}
