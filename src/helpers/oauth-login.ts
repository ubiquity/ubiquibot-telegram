import { GITHUB_PATHNAME } from "../constants";
import { ExtendableEventType } from "../types/Basic";
import { deleteUserSession, getUserSession, hasUserSession } from "./session";

// use secrets
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
      `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${url.origin}${GITHUB_PATHNAME}?telegramId=${telegramId}`,
      302
    );
  }

  try {
    if (await hasUserSession(telegramId as string)) {
      const response = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "user-agent": "cloudflare-worker-github-oauth-login-demo",
          accept: "application/json",
        },
        body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code }),
      });
      const result = await response.json();
      const headers = {
        "Access-Control-Allow-Origin": "*",
      };

      if (result.error) {
        return new Response(JSON.stringify(result), { status: 401, headers });
      }

      const {user, group} = await getUserSession(telegramId as string);
      return new Response(JSON.stringify({ token: result.access_token, user, group}), {
        status: 201,
        headers,
      });
    } else {
      return new Response(JSON.stringify({  error: "Not a valid session" }), {
        status: 400,
      });
    }
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ error }), {
        status: 400,
      });
  } finally {
    deleteUserSession(telegramId as string)
  }
};
