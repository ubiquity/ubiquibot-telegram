import { ExtendableEventType } from "../types/basic";
import { JwtResponse, validateJwt } from "./jwt";
import { replyMessage, sendReply } from "./triggers";
import { escapeMarkdown } from "./utils";

export async function sendLogsToGroup(ev: ExtendableEventType) {
  const headers = ev.request.headers;
  const jwtAuth = headers.get("Authorization");

  // Check if the Authorization header is missing
  if (!jwtAuth) {
    return new Response("Authorization header is missing", {
      status: 401,
      statusText: "Unauthorized",
    });
  }

  try {
    const { payload } = await validateJwt(jwtAuth);
    const { group, topic, msg } = payload as JwtResponse;

    if (topic) {
      await sendReply(group, topic, escapeMarkdown(msg, "*`[]()@"), true);
    } else {
      await replyMessage(group, msg);
    }
  } catch (e) {
    console.error("JWT validation error:", e);

    // Return an error response
    return new Response("Unauthorized - JWT validation failed", {
      status: 401,
      statusText: "Unauthorized",
    });
  }

  return new Response("ok");
}
