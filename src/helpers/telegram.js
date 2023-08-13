const { hasUserSession, getUserSession, deleteUserSession } = require("./session");
const { addTelegramBot, getTelegramBotByFromId, linkGithubRepoToTelegram } = require("./supabase");
const { apiUrl, replyMessage, editBotMessage } = require("./triggers");
const { extractSlashCommand } = require("./utils");

// Check if user is admin of group
const isAdminOfChat = async (userId, chatId) => {
  const data = {
    chat_id: chatId,
    user_id: userId,
  };

  try {
    const response = await fetch(apiUrl("getChatMember", data));

    const res = await response.json();

    // Check if the API response indicates the user is an admin
    return res.ok && (res.result.status === "administrator" || res.result.status === "creator");
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false; // Assume user is not an admin in case of error
  }
};

const getBotUsername = async () => {
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

const getGroupDetails = async (chatId) => {
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

const isBotAdded = async (chatId, fromId, groupName) => {
  console.log("bot added");
  await addTelegramBot(chatId, fromId, groupName);
  await replyMessage(chatId, "Bot successfully installed, please use the /start command in private chat to set it up");
};

const isBotRemoved = async (chatId, fromId) => {
  console.log("bot removed");
  //await removeTelegramBot(chatId, fromId) // do nothing now
};

const listGroupsWithBot = async (from, chatId, messageId) => {
  let res = await getTelegramBotByFromId(from);
  let groups = res.data;

  if (groups.length > 0) {
    const keyboardRes = groups.map((e) => ({
      text: e.group_name,
      callback_data: `group:${e.id}`,
    }));
    messageId
      ? await editBotMessage(chatId, messageId, "Choose a group from the list below:", keyboardRes)
      : await replyMessage(chatId, "Choose a group from the list below:", keyboardRes);
  } else {
    messageId
      ? await editBotMessage(chatId, messageId, "Oops, you don't have the bot installed on any of your groups")
      : await replyMessage(chatId, "Oops, you don't have the bot installed on any of your groups");
  }
};

const handleSetGithubRepo = async (fromId, chatId, githubUrl) => {
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

const handleSlashCommand = async (isSlash, text, fromId, chatId) => {
  if (isSlash) {
    const { command } = extractSlashCommand(text);

    switch (command) {
      case "/start":
        await listGroupsWithBot(fromId, chatId);
        break;
      default:
        break;
    }
  } else {
    // Check if the user has an active session
    if (hasUserSession(chatId)) {
      const userContext = getUserSession(chatId);
      // Handle the message based on the user's context
      switch (userContext.v) {
        case "link_github":
          // Process the repository name provided by the user
          const saved = await handleSetGithubRepo(fromId, userContext.c, text);
          if (saved) {
            // Clear the user's context after processing
            deleteUserSession(chatId);
          }
          break;
        // Add more cases for other contexts
        default:
          console.log("User replied:", text);
          break;
      }
    }
  }
};

module.exports = {
  isAdminOfChat,
  getBotUsername,
  isBotAdded,
  isBotRemoved,
  handleSlashCommand,
  getGroupDetails,
  listGroupsWithBot,
};
