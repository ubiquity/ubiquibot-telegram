const { apiUrl } = require("./triggers");

// Check if user is admin of group
const isAdminOfChat = async (userId, chatId) =>
{
    const data = {
        chat_id: chatId,
        user_id: userId
    };

    try
    {
        const response = await fetch(apiUrl("getChatMember", data))

        const res = await response.json();

        // Check if the API response indicates the user is an admin
        return res.ok && (res.result.status === 'administrator' || res.result.status === 'creator');
    } catch (error)
    {
        console.error('Error checking admin status:', error);
        return false; // Assume user is not an admin in case of error
    }
}

const getBotUsername = async () =>
{
    try
    {
        const response = await fetch(apiUrl("getMe"));
        const data = await response.json();

        // Check if the API response contains the bot's username
        if (data.ok && data.result.username)
        {
            return data.result.username;
        } else
        {
            throw new Error('Bot username not found in API response');
        }
    } catch (error)
    {
        console.error('Error fetching bot username:', error);
        return 'UNKNOWN_BOT'; // Fallback in case of error
    }
}

const isBotAdded = async () =>
{

}

const isBotRemoved = async () =>
{

}

module.exports = {
    isAdminOfChat,
    getBotUsername,
    isBotAdded,
    isBotRemoved
}