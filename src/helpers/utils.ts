import { KeyboardDataType, ParsedDataType, TaskInfoType } from "../types/telegram";
import { getForum, getRepoByGroupId } from "./supabase";

// global variable to track the last successful analysis timestamp
let lastAnalysisTimestamp = 0;

// Define the cool down interval in milliseconds
const coolDownInterval = 60000; // Example: 1 minute cool down

/**
 * Escape string for use in MarkdownV2-style text
 * if `except` is provided, it should be a string of characters to not escape
 * https://core.telegram.org/bots/api#markdownv2-style
 */
export function escapeMarkdown(str: string, except = "") {
  const all = "_*[]()~`>#+-=|{}.!\\".split("").filter((c) => !except.includes(c));
  const regExSpecial = "^$*+?.()|{}[]\\";
  const regEx = new RegExp("[" + all.map((c) => (regExSpecial.includes(c) ? "\\" + c : c)).join("") + "]", "gim");
  return str.replace(regEx, "\\$&");
}

export function capitalizeWords(inputString: string) {
  return inputString
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function extractNumberWithoutPrefix(text: string) {
  const numberWithoutPrefix = text.replace(/^(-)?\d{3}/, "");
  return numberWithoutPrefix.length === 10 ? numberWithoutPrefix : null;
}

export function cleanMessage(text: string) {
  // Remove all occurrences of @tag
  const cleanedText = text.replace(/@\w+/g, "");

  // Remove all occurrences of links (http and https)
  return cleanedText.replace(/(https?:\/\/[^\s]+)/g, "");
}

export function removeTag(text: string) {
  // Remove all occurrences of @tag
  return text.replace(/@\w+/g, "").trim();
}

export function extractTag(text: string) {
  const regex = /@(\w+)/;
  const match = regex.exec(text);
  return match ? match[1] : null;
}

export function removeNewlinesAndExtractValues(text: string) {
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
}

/**
 * Get repo data from mapping
 */
export async function getRepoData(groupId: number, forumName: string) {
  let data;
  if (forumName) {
    const res = await getForum(groupId, forumName);
    data = res?.github_repo;
  } else {
    data = await getRepoByGroupId(groupId);
  }
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
}

export function generateMessageLink(messageId: number, groupId: number) {
  return `https://t.me/c/${extractNumberWithoutPrefix(groupId?.toString())}/${messageId?.toString()}`;
}

export function generateGitHubIssueBody(interceptedMessage: string, telegramMessageLink: string) {
  const quotedMessage = `${interceptedMessage}\n\n`;
  const footer = `###### [ **[ View on Telegram ]** ](${telegramMessageLink})`;
  return `${quotedMessage}${footer}`;
}

export function extractTaskInfo(text: string): TaskInfoType {
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
}

// Function to check if text begins with a slash
export function slashCommandCheck(text: string) {
  return text.startsWith("/");
}

// Function to extract the command and extra text
export function extractSlashCommand(text: string) {
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
}

// Cool down function that checks if the cool down period has passed
export function isCoolDownReady() {
  const currentTime = Date.now();
  return currentTime - lastAnalysisTimestamp >= coolDownInterval;
}

export function setLastAnalysisTimestamp(timestamp: number) {
  lastAnalysisTimestamp = timestamp;
}

export function parseCallData(callData: string): ParsedDataType[] {
  const parts = callData.split(","); // Split by comma
  const result = [];

  for (const part of parts) {
    const [key, value] = part.split(":"); // Split by colon
    result.push({ key: key, value: value });
  }

  return result;
}

// divide keyboardValues into chunks of 2
export function createKeyboardRow(keyboardValues: KeyboardDataType[]) {
  return keyboardValues.reduce((acc: KeyboardDataType[][], cur, i) => {
    const index = Math.floor(i / 2);
    if (!acc[index]) {
      acc[index] = [];
    }
    acc[index].push(cur);
    return acc;
  }, []);
}
