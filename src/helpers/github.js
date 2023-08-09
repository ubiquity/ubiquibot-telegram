const { generateGitHubIssueBody } = require("./utils");

/**
 * Get User in Organization
 */

const getGithubUserData = async (orgName, user) =>
{
  try
  {
    const apiUrl = `https://api.github.com/orgs/${orgName}/memberships/${user}`;

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
    if (data?.user)
    {
      return [data?.user?.login];
    }
    return [];
  } catch (error)
  {
    console.log("Error creating issue:", error);
    return null;
  }
}

/**
 * Create Issue on Github
 */
const createIssue = async (timeEstimate, organization, repository, issueTitle, messageText, messageLink, tagged) =>
{
  console.log("Creating Github Issue:", organization, repository, issueTitle, messageText, messageLink, tagged);
  try
  {
    const apiUrl = `https://api.github.com/repos/${organization}/${repository}/issues`;

    // labels array
    const labels = [DEFAULT_PRIORITY, `Time: <${timeEstimate}`];

    // create body
    const issueBody = generateGitHubIssueBody(messageText, messageLink);

    // get user if tagged exist
    const assignees = tagged ? await getGithubUserData(organization, tagged) : []

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `token ${GITHUB_PAT}`,
        "Content-Type": "application/json",
        "User-Agent": "Telegram Cloudflare Worker",
      },
      body: JSON.stringify({
        title: issueTitle,
        body: issueBody,
        labels,
        assignees
      }),
    });
    const data = await response.json();
    return { data, assignees: assignees.length > 0 };
  } catch (error)
  {
    console.log("Error creating issue:", error);
    return { data: null, assignees: false };
  }
};

module.exports = {
  createIssue,
};
