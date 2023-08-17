const userSessions = new Map(); // Store user sessions and context

export const setUserSession = (chatId: number, context: string | object) => {
  userSessions.set(chatId, context);
};

export const getUserSession = (chatId: number) => {
  return userSessions.get(chatId);
};

export const hasUserSession = (chatId: number) => {
  return userSessions.has(chatId);
};

export const deleteUserSession = (chatId: number) => {
  userSessions.delete(chatId);
};
