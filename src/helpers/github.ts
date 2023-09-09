import { GITHUB_PATHNAME } from "../constants";
import { setUserSession } from "./session";
import { replyMessage } from "./triggers";
import { capitalizeWords, generateGitHubIssueBody, generateRandomId } from "./utils";

const GITHUB_API_URL = "https://api.github.com";

/**
 * Get User in Organization
 */

export const getGithubUserData = async (orgName: string, user: string) => {
  try {
    const apiUrl = `${GITHUB_API_URL}/orgs/${orgName}/memberships/${user}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `token ${GITHUB_PAT}`,
        "Content-Type": "application/json",
        "User-Agent": "Telegram Cloudflare Worker",
      },
    });
    const data = await response.json();
    // check if user exist
    if (data?.user) {
      return [data?.user?.login];
    }
    return [];
  } catch (error) {
    console.log("Error creating issue:", error);
    return null;
  }
};

/**
 * Get user from username
 */
export const getUserDataFromUsername = async (username: string) => {
  try {
    const apiUrl = `${GITHUB_API_URL}/users/${username}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `token ${GITHUB_PAT}`,
        "Content-Type": "application/json",
        "User-Agent": "Telegram Cloudflare Worker",
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
};

/**
 * Get user from id
 */
export const getUserDataFromId = async (id: number) => {
  try {
    const apiUrl = `${GITHUB_API_URL}/user/${id}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `token ${GITHUB_PAT}`,
        "Content-Type": "application/json",
        "User-Agent": "Telegram Cloudflare Worker",
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
};

/**
 * Create Issue on Github
 */
export const createIssue = async (
  timeEstimate: string,
  organization: string,
  repository: string,
  issueTitle: string,
  messageText: string,
  messageLink: string,
  tagged: number,
  token: string
) => {
  console.log("Creating Github Issue:", organization, repository, issueTitle, messageText, messageLink, tagged);
  try {
    const apiUrl = `${GITHUB_API_URL}/repos/${organization}/${repository}/issues`;

    const timeCapitalized = capitalizeWords(timeEstimate);

    // labels array
    const labels = token ? [] : [`Time: <${timeCapitalized}`]; // add no labels when using user token

    console.log(labels)

    // create body
    const issueBody = generateGitHubIssueBody(messageText, messageLink);

    // get user if tagged exist
    let assignees: string[];

    if (tagged === -1) {
      assignees = [];
    } else {
      const username = await getUserDataFromId(tagged);
      assignees = username ? [username] : [];
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `token ${token || GITHUB_INSTALLATION_TOKEN || GITHUB_PAT}`,
        "Content-Type": "application/json",
        "User-Agent": "Telegram Cloudflare Worker",
      },
      body: JSON.stringify({
        title: issueTitle,
        body: issueBody,
        labels,
        assignees,
      }),
    });
    const data = await response.json();
    return { data, assignees: assignees !== null && assignees.length > 0 };
  } catch (error) {
    console.log("Error creating issue:", error);
    return { data: null, assignees: false, error };
  }
};

export const createGithubTelegramLink = async (username: string, telegramId: number, group: number, origin: string) => {
  const id = crypto.randomUUID();

  await setUserSession(id, { username, group, telegramId });

  const url = `${origin}${GITHUB_PATHNAME}?telegramId=${id}`;

  await replyMessage(telegramId, `Use this to link your Github: ${url}`);

  return true;
};

export default {
  createIssue,
};
