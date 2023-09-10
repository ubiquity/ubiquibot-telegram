import { ParsedDataType, TaskInfoType } from "../types/Basic";
import { getRepoByGroupId } from "./supabase";

// global variable to track the last successful analysis timestamp
let lastAnalysisTimestamp = 0;

// Define the cooldown interval in milliseconds
const cooldownInterval = 60000; // Example: 1 minute cooldown

/**
 * Escape string for use in MarkdownV2-style text
 * if `except` is provided, it should be a string of characters to not escape
 * https://core.telegram.org/bots/api#markdownv2-style
 */
export const escapeMarkdown = (str: string, except = "") => {
  const all = "_*[]()~`>#+-=|{}.!\\".split("").filter((c) => !except.includes(c));
  const regExSpecial = "^$*+?.()|{}[]\\";
  const regEx = new RegExp("[" + all.map((c) => (regExSpecial.includes(c) ? "\\" + c : c)).join("") + "]", "gim");
  return str.replace(regEx, "\\$&");
};

export const capitalizeWords = (inputString: string) => {
  return inputString
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export const extractNumberWithoutPrefix = (text: string) => {
  const numberWithoutPrefix = text.replace(/^(-)?\d{3}/, "");
  return numberWithoutPrefix.length === 10 ? numberWithoutPrefix : null;
};

export const cleanMessage = (text: string) => {
  // Remove all occurrences of @tag
  const cleanedText = text.replace(/@\w+/g, "");

  // Remove all occurrences of links (http and https)
  return cleanedText.replace(/(https?:\/\/[^\s]+)/g, "");
};

export const removeTag = (text: string) => {
  // Remove all occurrences of @tag
  const cleanedText = text.replace(/@\w+/g, "").trim();
  return cleanedText;
};

export const extractTag = (text: string) => {
  const regex = /@(\w+)/;
  const match = regex.exec(text);
  return match ? match[1] : null;
};

export const removeNewlinesAndExtractValues = (text: string) => {
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
export const getRepoData = async (groupId: number) => {
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

export const generateMessageLink = (messageId: number, groupId: number) => {
  return `https://t.me/c/${extractNumberWithoutPrefix(groupId?.toString())}/${messageId?.toString()}`;
};

export const generateGitHubIssueBody = (interceptedMessage: string, telegramMessageLink: string) => {
  const quotedMessage = `> ${interceptedMessage.replace(/\n/g, "\n> ")}\n\n`;
  const footer = `###### [ **[ View Conversation Context ]** ](${telegramMessageLink})`;
  return `${quotedMessage}${footer}`;
};

export const extractTaskInfo = (text: string): TaskInfoType => {
  const regex = /"(.*?)" on (.*?)\/(.*?) with time estimate (.+?)$/;
  const match = text.match(regex);
  console.log(match);

  if (match) {
    const [, title, orgName, repoName, timeEstimate] = match;
    return {
      title,
      orgName,
      repoName,
      timeEstimate,
    };
  } else {
    return {
      title: null,
      orgName: null,
      repoName: null,
      timeEstimate: null,
    };
  }
};

// Function to check if text begins with a slash
export const slashCommandCheck = (text: string) => {
  return text.startsWith("/");
};

// Function to extract the command and extra text
export const extractSlashCommand = (text: string) => {
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

// Cooldown function that checks if the cooldown period has passed
export const isCooldownReady = () => {
  const currentTime = Date.now();
  return currentTime - lastAnalysisTimestamp >= cooldownInterval;
};

export const setLastAnalysisTimestamp = (timestamp: number) => {
  lastAnalysisTimestamp = timestamp;
};

export const parseCallData = (callData: string): ParsedDataType[] => {
  const parts = callData.split(","); // Split by comma
  const result = [];

  for (const part of parts) {
    const [key, value] = part.split(":"); // Split by colon
    result.push({ key: key, value: value });
  }

  return result;
};

export const getLastAnalysisTimestamp = () => lastAnalysisTimestamp;

export const generateRandomId = (length: number) =>
  Array.from({ length }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 62)]).join("");

export default {
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
};
