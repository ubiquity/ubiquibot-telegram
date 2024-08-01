import TelegramUser from "./TelegramUser.js";

interface TelegramMessageEntity {
  type: string;
  offset: number;
  length: number;
  url?: string;
  user?: TelegramUser;
  language?: string;
}
export default TelegramMessageEntity;
