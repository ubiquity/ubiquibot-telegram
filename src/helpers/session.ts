export const userSessions = new Map(); // Store user sessions and context

export const setUserSession = (chatId: number | string, context: string | object) => {
  userSessions.set(chatId, context);
};

export const getUserSession = (chatId: number | string) => {
  return userSessions.get(chatId);
};

export const hasUserSession = (chatId: number | string) => {
  return userSessions.has(chatId);
};

export const deleteUserSession = (chatId: number | string) => {
  userSessions.delete(chatId);
};
