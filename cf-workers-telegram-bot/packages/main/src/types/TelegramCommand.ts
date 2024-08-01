import TelegramBot from "../telegram_bot.js";
import TelegramUpdate from "./TelegramUpdate.js";

type TelegramCommand = (bot: TelegramBot, update: TelegramUpdate, args: string[]) => Promise<Response>;
export default TelegramCommand;
