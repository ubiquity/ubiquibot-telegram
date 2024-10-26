import { GITHUB_PATHNAME } from "../constants";
import { checkEnvVars } from "./parse-env";
import { setUserSession } from "./session";
import { replyMessage } from "./triggers";
import { capitalizeWords, generateGitHubIssueBody } from "./utils";
const env = checkEnvVars();

const GITHUB_API_URL = "https://api.github.com";
const TELEGRAM_CF_WORKER = "Telegram Cloudflare Worker";

/**
 * Get user from username
 */
export async function getUserDataFromUsername(username: string) {
  try {
    const apiUrl = `${GITHUB_API_URL}/users/${username}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `token ${env.GITHUB_PAT}`,
        "Content-Type": "application/json",
        "User-Agent": TELEGRAM_CF_WORKER,
      },
    });
    const data = await response.json();
    if (data?.id) {
      return data?.id;
    }
    return -1;
  } catch (error) {
    console.log("Error fetching user:", error);
    return -1;
  }
}

/**
 * Get user from id
 */
export async function getUserDataFromId(id: number) {
  try {
    const apiUrl = `${GITHUB_API_URL}/user/${id}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `token ${env.GITHUB_PAT}`,
        "Content-Type": "application/json",
        "User-Agent": TELEGRAM_CF_WORKER,
      },
    });
    const data = await response.json();
    if (data?.login) {
      return data?.login;
    }
    return "";
  } catch (error) {
    console.log("Error fetching user:", error);
    return "";
  }
}

/**
 * Create Issue on Github
 */
export async function createIssue(
  timeEstimate: string,
  organization: string,
  repository: string,
  issueTitle: string,
  messageText: string,
  messageLink: string,
  tagged: number,
  token: string
) {
  console.log("Creating Github Issue:", organization, repository, issueTitle, messageText, messageLink, tagged);
  try {
    const apiUrl = `${GITHUB_API_URL}/repos/${organization}/${repository}/issues`;

    const timeCapitalized = capitalizeWords(timeEstimate);
    let titleCapitalized = capitalizeWords(issueTitle);

    // remove punctuation at the end of the titleCapitalized if it exists
    if (titleCapitalized[titleCapitalized.length - 1].match(/[.,/#!$%^&*;:{}=\-_`~()]/g)) {
      titleCapitalized = titleCapitalized.slice(0, -1);
    }

    // labels array
    const labels = token ? [] : [`Time: <${timeCapitalized}`]; // add no labels when using user token

    console.log(labels);

    // create body
    const issueBody = generateGitHubIssueBody(messageText, messageLink);

    // get user if tagged exist
    let assignees: string[] | null = null;

    if (tagged === -1) {
      assignees = [];
    } else {
      const username = await getUserDataFromId(tagged);
      assignees = username ? [username] : [];
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `token ${token || env.GITHUB_INSTALLATION_TOKEN || env.GITHUB_PAT}`,
        "Content-Type": "application/json",
        "User-Agent": TELEGRAM_CF_WORKER,
      },
      body: JSON.stringify({
        title: titleCapitalized,
        body: issueBody,
        labels,
        assignees,
      }),
    });
    const data = await response.json();

    if (assignees !== null && assignees.length > 0) {
      // assignees = assignees;
    } else {
      assignees = null;
    }

    return {
      data,
      assignees,
    };
  } catch (error) {
    console.log("Error creating issue:", error);
    return { data: null, assignees: null, error };
  }
}

export async function createGithubTelegramLink(username: string, telegramId: number, group: number, origin: string) {
  const id = crypto.randomUUID();

  await setUserSession(id, { username, group, telegramId });

  const url = `${origin}${GITHUB_PATHNAME}?telegramId=${id}`;

  await replyMessage(telegramId, `Use this to link your Github: ${url}`);

  return true;
}
