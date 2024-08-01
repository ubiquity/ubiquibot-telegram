import TelegramMessage from "./TelegramMessage.js";

interface TelegramChat {
  id: number;
  type: string;
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  // photo?: TelegramChatPhoto;
  bio?: string;
  has_private_forwards: boolean;
  description?: string;
  invite_link?: string;
  pinned_message?: TelegramMessage;
  // permissions?: TelegramChatPermissions;
  slow_mode_delay?: number;
  message_auto_delete_time?: number;
  has_protected_content?: boolean;
  sticker_set_name?: string;
  can_set_sticker_set?: boolean;
  linked_chat_id?: number;
}
export default TelegramChat;
