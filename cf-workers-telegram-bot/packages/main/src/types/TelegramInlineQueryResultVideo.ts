import TelegramInlineQueryResult from "./TelegramInlineQueryResult.js";
import TelegramInputMessageContent from "./TelegramInputMessageContent.js";

export default class TelegramInlineQueryResultVideo extends TelegramInlineQueryResult {
  video_url: string;
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
  constructor(video: string) {
    super("video");
    this.video_url = video;
    this.thumb_url = video;
  }
}
