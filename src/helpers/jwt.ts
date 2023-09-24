import jwt from '@tsndr/cloudflare-worker-jwt'

// validate and decode a JWT
export const validateJWT = async (token: string) => {
  try {
    const decoded = await jwt.verify(token, LOG_WEBHOOK_SECRET);
    if(!decoded) return;
    const { payload } = jwt.decode(token);

    if(!payload.group) {
      throw new Error("Invalid JWT"); 
    }

    return { decoded, payload }
  } catch (error) {
    throw new Error("Invalid JWT");
  }
};
