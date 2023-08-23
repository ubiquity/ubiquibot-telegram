import { GITHUB_PATHNAME } from "../constants";
import { KeyboardDataType } from "../types/Basic";
import { createGithubTelegramLink } from "./github";
import { hasUserSession, getUserSession, deleteUserSession } from "./session";
import { addTelegramBot, getTelegramBotByFromId, linkGithubRepoToTelegram } from "./supabase";
import { apiUrl, replyMessage, editBotMessage } from "./triggers";
import { extractSlashCommand } from "./utils";

// Check if user is admin of group
export const isAdminOfChat = async (userId: number, chatId: number) => {
  const data = {
    chat_id: chatId,
    user_id: userId,
  };

  try {
    const response = await fetch(apiUrl("getChatMember", data));

    const res = await response.json();

    console.log(res, chatId, userId);

    return res.ok && (res.result.status === "administrator" || res.result.status === "creator");
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false; // Assume user is not an admin in case of error
  }
};

export const getBotUsername = async () => {
  try {
    const response = await fetch(apiUrl("getMe"));
    const data = await response.json();

    // Check if the API response contains the bot's username
    if (data.ok && data.result.username) {
      return data.result.username;
    } else {
      throw new Error("Bot username not found in API response");
    }
  } catch (error) {
    console.error("Error fetching bot username:", error);
    return "UNKNOWN_BOT"; // Fallback in case of error
  }
};

export const getGroupDetails = async (chatId: number) => {
  const params = {
    chat_id: chatId,
  };
  try {
    const response = await fetch(apiUrl("getChat", params));
    const data = await response.json();

    const chat = data.result;

    // Check if the API response contains the bot's username
    if (data.ok && chat) {
      const name = chat.title || "N/A";
      return name;
    } else {
      throw new Error("Bot username not found in API response");
    }
  } catch (error) {
    console.log("Error fetching bot username:", error);
    return null;
  }
};

export const isBotAdded = async (chatId: number, fromId: number, groupName: string) => {
  console.log("bot added");
  await addTelegramBot(chatId, fromId, groupName);
  await replyMessage(chatId, "Bot successfully installed, please use the /start command in private chat to set it up");
};

export const isBotRemoved = async (chatId: number, fromId: number) => {
  console.log("bot removed", chatId, fromId);
  //await removeTelegramBot(chatId, fromId) // do nothing now
};

export const listGroupsWithBot = async (from: number, chatId: number, messageId: number | null = null) => {
  const res = await getTelegramBotByFromId(from);
  const groups = res && res.data;

  if (groups && groups.length > 0) {
    const keyboardRes: KeyboardDataType[] = groups.map((e) => ({
      text: e.group_name,
      callback_data: `group:${e.id}`,
    }));
    messageId
      ? await editBotMessage(chatId, messageId, "Choose a group from the list below:", keyboardRes)
      : await replyMessage(chatId, "Choose a group from the list below:", keyboardRes);
  } else {
    messageId
      ? await editBotMessage(chatId, messageId, "You do not have the bot installed on any of your groups.")
      : await replyMessage(chatId, "You do not have the bot installed on any of your groups.");
  }
};

export const handleSetGithubRepo = async (fromId: number, chatId: number, githubUrl: string) => {
  const githubUrlRegex = /^(https?:\/\/)?(www\.)?github\.com\/([\w-]+)\/([\w-]+)(\/.*)?$/i;
  const match = githubUrl.match(githubUrlRegex);
  if (!match) {
    const errorMessage = `Invalid GitHub URL. Please provide a valid GitHub repository URL.\n\nExamples:\n- https://github.com/user/repo\n- https://www.github.com/user/repo`;
    await replyMessage(fromId, errorMessage);
    return false;
  }

  const orgName = match[3];
  const repoName = match[4];

  // Here, you can proceed with sending the GitHub URL to the database and returning a success message
  await linkGithubRepoToTelegram(fromId, chatId, `${orgName}/${repoName}`);

  const successMessage = `GitHub repository URL successfully set: ${githubUrl}`;
  await replyMessage(fromId, successMessage, [
    {
      text: "« Back to Group List",
      callback_data: `group_list`,
    },
  ]);
  return true;
};

export const handleSlashCommand = async (isPrivate: boolean, isSlash: boolean, text: string, fromId: number, chatId: number, username: string, url: URL) => {
  if (isSlash) {
    const { command } = extractSlashCommand(text);

    switch (command) {
      case "/start":
        if (isPrivate) {
          await listGroupsWithBot(fromId, chatId); // private chat only
        }
        break;
      case GITHUB_PATHNAME:
        await createGithubTelegramLink(username, fromId, chatId, url.origin);
        break;
      default:
        break;
    }
  } else {
    if (await hasUserSession(chatId)) {
      const userContext = await getUserSession(chatId);
      switch (userContext.v) {
        case "link_github":
          const saved = await handleSetGithubRepo(fromId, userContext.c, text);
          if (saved) {
            await deleteUserSession(chatId);
          }
          break;
        default:
          console.log("User replied:", text);
          break;
      }
    }
  }
};
