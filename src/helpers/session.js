const userSessions = new Map(); // Store user sessions and context

function setUserSession(chatId, context) {
  userSessions.set(chatId, context);
}

function getUserSession(chatId) {
  return userSessions.get(chatId);
}

function hasUserSession(chatId) {
  return userSessions.has(chatId);
}

function deleteUserSession(chatId) {
  userSessions.delete(chatId);
}

module.exports = {
  deleteUserSession,
  getUserSession,
  setUserSession,
  hasUserSession,
};
