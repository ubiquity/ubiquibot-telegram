import { ExtendableEventType } from "../types/Basic";
import { JWTResponse, validateJWT } from "./jwt";
import { replyMessage, sendReply } from "./triggers";

export const sendLogsToGroup = async (ev: ExtendableEventType) => {
  const headers = ev.request.headers;
  const jwtAuth = headers.get("Authorization");

  // Check if the Authorization header is missing
  if (!jwtAuth) {
    return new Response("Authorization header is missing", {
      status: 401, // Unauthorized
      statusText: "Unauthorized",
    });
  }

  try{
    const { payload } = await validateJWT(jwtAuth);
    const { group, topic, msg } = payload as JWTResponse;

    if(topic) {
        await sendReply(group, topic, msg, true)
    } else {
        await replyMessage(group, msg)
    }
  } catch (e) {
    console.error("JWT validation error:", e);

    // Return an error response
    return new Response("Unauthorized - JWT validation failed", {
      status: 401, // Unauthorized
      statusText: "Unauthorized",
    });
  }

  return new Response("ok");
};