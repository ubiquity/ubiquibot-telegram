const { getRepoByGroupId } = require("./supabase");

// global variable to track the last successful analysis timestamp
let lastAnalysisTimestamp = 0;

// Define the cooldown interval in milliseconds
const cooldownInterval = 60000; // Example: 1 minute cooldown

/**
 * Escape string for use in MarkdownV2-style text
 * if `except` is provided, it should be a string of characters to not escape
 * https://core.telegram.org/bots/api#markdownv2-style
 */
const escapeMarkdown = (str, except = "") => {
  const all = "_*[]()~`>#+-=|{}.!\\".split("").filter((c) => !except.includes(c));
  const regExSpecial = "^$*+?.()|{}[]\\";
  const regEx = new RegExp("[" + all.map((c) => (regExSpecial.includes(c) ? "\\" + c : c)).join("") + "]", "gim");
  return str.replace(regEx, "\\$&");
};

const extractNumberWithoutPrefix = (text) => {
  const numberWithoutPrefix = text.replace(/^(-)?\d{3}/, "");
  return numberWithoutPrefix.length === 10 ? numberWithoutPrefix : null;
};

const cleanMessage = (text) => {
  // Remove all occurrences of @tag
  const cleanedText = text.replace(/@\w+/g, "");

  // Remove all occurrences of links (http and https)
  return cleanedText.replace(/(https?:\/\/[^\s]+)/g, "");
};

const removeTag = (text) => {
  // Remove all occurrences of @tag
  const cleanedText = text.replace(/@\w+/g, "").trim();
  return cleanedText;
};

function extractTag(text) {
  const regex = /@(\w+)/;
  const match = regex.exec(text);
  return match ? match[1] : null;
}

// Function to check if text begins with a slash
function slashCommandCheck(text) {
  return text.startsWith("/");
}

// Function to extract the command and extra text
const extractSlashCommand = (text) => {
  // Remove leading and trailing spaces
  const trimmedText = text.trim();

  // Split the text into parts using the first space as a separator
  const parts = trimmedText.split(" ");

  // The first part will be the command (starts with a slash)
  const command = parts[0].startsWith("/") ? parts[0] : null;

  // The rest of the parts will be considered as extra text
  const extraText = parts.slice(1).join(" ");

  return {
    command: command,
    extraText: extraText,
  };
};

const removeNewlinesAndExtractValues = (text) => {
  // Remove all occurrences of '\n'
  const textWithoutNewlines = text.replace(/\n/g, "");

  // Extract Issue Title and Time Estimate using regex
  const issueTitleRegex = /Issue Title: (.*?)(?=Time Estimate|$)/;
  const timeEstimateRegex = /Time Estimate: (.*?)(?=\.$|$)/;

  const issueTitleMatch = textWithoutNewlines.match(issueTitleRegex);
  const timeEstimateMatch = textWithoutNewlines.match(timeEstimateRegex);

  const issueTitle = issueTitleMatch ? issueTitleMatch[1].trim() : null;
  const timeEstimate = timeEstimateMatch ? timeEstimateMatch[1].trim() : null;

  return { issueTitle, timeEstimate };
};

/**
 * Get repo data from mapping
 */
const getRepoData = async (groupId) => {
  const data = await getRepoByGroupId(groupId);
  if (data) {
    const orgName = data.split("/")[0];
    const repoName = data.split("/")[1];
    return {
      orgName,
      repoName,
    };
  }

  return {
    orgName: null,
    repoName: null,
  };
};

const generateMessageLink = (messageId, groupId) => {
  return `https://t.me/c/${extractNumberWithoutPrefix(groupId?.toString())}/${messageId?.toString()}`;
};

const generateGitHubIssueBody = (interceptedMessage, telegramMessageLink) => {
  const quotedMessage = `> ${interceptedMessage.replace(/\n/g, "\n> ")}\n\n`;
  const footer = `###### [ **[ View Conversation Context ]** ](${telegramMessageLink})`;
  return `${quotedMessage}${footer}`;
};

const extractTaskInfo = (text) => {
  const regex = /"(.*?)" on (.*?)\/(.*?) with time estimate (.+?)$/;
  const match = text.match(regex);
  console.log(match);

  if (match) {
    const [_, title, orgName, repoName, timeEstimate] = match;
    return {
      title,
      orgName,
      repoName,
      timeEstimate,
    };
  } else {
    return null;
  }
};

const parseCallData = (callData) => {
  const parts = callData.split(","); // Split by comma
  const result = [];

  for (const part of parts) {
    const [key, value] = part.split(":"); // Split by colon
    result.push({ key: key, value: value });
  }

  return result;
};

// Cooldown function that checks if the cooldown period has passed
const isCooldownReady = () => {
  const currentTime = Date.now();
  return currentTime - lastAnalysisTimestamp >= cooldownInterval;
};

const setLastAnalysisTimestamp = (timestamp) => {
  lastAnalysisTimestamp = timestamp;
};

const getLastAnalysisTimestamp = () => lastAnalysisTimestamp;

module.exports = {
  removeNewlinesAndExtractValues,
  cleanMessage,
  escapeMarkdown,
  getRepoData,
  extractTag,
  generateMessageLink,
  generateGitHubIssueBody,
  extractTaskInfo,
  removeTag,
  isCooldownReady,
  getLastAnalysisTimestamp,
  setLastAnalysisTimestamp,
  extractSlashCommand,
  slashCommandCheck,
  parseCallData,
};
