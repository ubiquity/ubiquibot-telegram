import jwt from "@tsndr/cloudflare-worker-jwt";

// data to include in the JWT
export interface JWTResponse {
  group: number; // -1001558587400
  topic: number; // 556
  msg: string; // Error: Notification test
}

// validate and decode a JWT
export const validateJWT = async (token: string) => {
  try {
    const isDecoded = await jwt.verify(token, LOG_WEBHOOK_SECRET);

    if (!isDecoded) {
      throw new Error("Invalid JWT");
    }

    const { payload } = jwt.decode(token);

    if (!payload.group) {
      throw new Error("Invalid JWT, group is missing");
    }

    return { decoded: isDecoded, payload };
  } catch (error) {
    throw new Error("Invalid JWT");
  }
};
