import { ExtendableEventType } from "../types/Basic";

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
  
  const code = queryParams.get('code');

  // redirect GET requests to the OAuth login page on github.com
  if (event.request.method === "GET" && !code) {
    return Response.redirect(
      `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}`,
      302
    );
  }

  try {
    const response = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "user-agent": "cloudflare-worker-github-oauth-login-demo",
          accept: "application/json",
        },
        body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code }),
      }
    );
    const result = await response.json();
    const headers = {
      "Access-Control-Allow-Origin": "*",
    };

    if (result.error) {
      return new Response(JSON.stringify(result), { status: 401, headers });
    }

    return new Response(JSON.stringify({ token: result.access_token }), {
      status: 201,
      headers,
    });
  } catch (error) {
    console.error(error);
    return new Response("", {
      status: 500,
    });
  }
}