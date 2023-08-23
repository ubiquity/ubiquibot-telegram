import { GITHUB_PATHNAME } from "../constants";
import { ExtendableEventType } from "../types/Basic";
import { deleteUserSession, getUserSession, hasUserSession } from "./session";
import { bindGithubToTelegramUser } from "./supabase";
import { replyMessage } from "./triggers";

export const getUserData = async (token: string, telegramId: number, username: string, groupId: number, headers: HeadersInit) => {
  const getUserResponse = await fetch("https://api.github.com/user", {
    headers: {
      accept: "application/vnd.github.v3+json",
      authorization: `token ${token}`,
      "User-Agent": "Telegram Cloudflare Worker",
    },
  });

  const { login } = await getUserResponse.json();

  if (login) {
    await bindGithubToTelegramUser(groupId, username, login);

    await replyMessage(telegramId, `Your telegram account has been binded with Github account: *${login}*`);

    return new Response(JSON.stringify({ success: `${login} has been binded to your telegram account` }), {
      status: 201,
      headers,
    });
  } else {
    return new Response(JSON.stringify({ error: "Error occured while fetching user" }), {
      status: 400,
    });
  }
};

export const OAuthHandler = async (event: ExtendableEventType, url: URL) => {
  // handle CORS pre-flight request
  if (event.request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const queryParams = url.searchParams;

  const code = queryParams.get("code");
  const telegramId = queryParams.get("telegramId");

  // redirect GET requests to the OAuth login page on github.com
  if (event.request.method === "GET" && !code) {
    if (!telegramId)
      return new Response("", {
        status: 500,
      });

    return Response.redirect(
      `https://github.com/login/oauth/authorize?client_id=${GITHUB_OAUTH_CLIENT_ID}&redirect_uri=${url.origin}${GITHUB_PATHNAME}?telegramId=${telegramId}`,
      302
    );
  }

  try {
    if (await hasUserSession(telegramId as string)) {
      const response = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "User-Agent": "Telegram Cloudflare Worker",
          accept: "application/json",
        },
        body: JSON.stringify({ client_id: GITHUB_OAUTH_CLIENT_ID, client_secret: GITHUB_OAUTH_CLIENT_SECRET, code }),
      });
      const result = await response.json();
      const headers = {
        "Access-Control-Allow-Origin": "*",
      };

      if (result.error) {
        return new Response(JSON.stringify(result), { status: 401, headers });
      }

      const { username, group, telegramId: id } = await getUserSession(telegramId as string);

      const res = await getUserData(result.access_token, id, username, group, headers);

      return res;
    } else {
      return new Response(JSON.stringify({ error: "Not a valid session" }), {
        status: 400,
      });
    }
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ error }), {
      status: 400,
    });
  } finally {
    await deleteUserSession(telegramId as string);
  }
};
