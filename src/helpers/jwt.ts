import jwt from "@tsndr/cloudflare-worker-jwt";
import { checkEnvVars } from "./parse-env";
const env = checkEnvVars();

// data to include in the JWT
export interface JwtResponse {
  group: number; // -1001558587400
  topic: number; // 556
  msg: string; // Error: Notification test
}

// validate and decode a JWT
export async function validateJwt(token: string) {
  try {
    const isDecoded = await jwt.verify(token, env.LOG_WEBHOOK_SECRET);

    if (!isDecoded) {
      throw new Error("Invalid JWT");
    }

    const { payload } = jwt.decode(token) as { payload: JwtResponse };

    if (!payload.group) {
      throw new Error("Invalid JWT, group is missing");
    }

    return { decoded: isDecoded, payload };
  } catch (error) {
    throw new Error("Invalid JWT");
  }
}
