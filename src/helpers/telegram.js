const { addTelegramBot, removeTelegramBot, getTelegramBotByFromId } = require("./supabase");
const { apiUrl, replyMessage } = require("./triggers");
const { extractSlashCommand } = require("./utils");

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

const isBotAdded = async (chatId, fromId, groupName) =>
{
    console.log('bot added');
    await addTelegramBot(chatId, fromId, groupName)
}

const isBotRemoved = async (chatId, fromId) =>
{
    console.log('bot removed');
    await removeTelegramBot(chatId, fromId)
}

const listGroupsWithBot = async (from, chatId) =>
{
    let res = await getTelegramBotByFromId(from);
    let groups = res.data;

    if (groups.length > 0)
    {
        const keyboardRes = groups.map((e) => ({
            text: e.group_name,
            callback_data: `group:${e.id}`
        }))
        await replyMessage(
            chatId,
            keyboardRes,
            'Choose a group from the list below:'
        )
    } else
    {
        await replyMessage(
            chatId,
            [],
            'Oops, you don\'t have the bot installed on any of your groups'
        )
    }
}

const handleSlashCommand = async (text, from, chatId) =>
{
    const { command } = extractSlashCommand(text);

    switch (command)
    {
        case '/start':
            await listGroupsWithBot(from, chatId)
            break;
        default:
            break;
    }
}

module.exports = {
    isAdminOfChat,
    getBotUsername,
    isBotAdded,
    isBotRemoved,
    handleSlashCommand
}