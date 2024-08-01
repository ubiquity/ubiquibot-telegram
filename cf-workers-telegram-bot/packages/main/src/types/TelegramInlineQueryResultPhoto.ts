import TelegramInlineQueryResult from "./TelegramInlineQueryResult.js";
import TelegramInputMessageContent from "./TelegramInputMessageContent.js";

export default class TelegramInlineQueryResultPhoto extends TelegramInlineQueryResult {
  photo_url: string; // must be a jpg
  thumb_url: string;
  photo_width?: number;
  photo_height?: number;
  title?: string;
  description?: string;
  caption?: string;
  parse_mode?: string;
  caption_entities?: string;
  // reply_markup?: TelegramInlineKeyboardMarkup;
  input_message_content?: TelegramInputMessageContent;
  constructor(photo: string) {
    super("photo");
    this.photo_url = photo;
    this.thumb_url = photo;
  }
}
