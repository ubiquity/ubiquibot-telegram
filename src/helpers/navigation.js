const { setUserSession } = require("./session");
const { getGroupDetails } = require("./telegram");
const { editBotMessage, replyMessage } = require("./triggers");
const { parseCallData } = require("./utils");

const handleSetGithubRepo = async (githubUrl) =>
{
    const githubUrlRegex = /^(https?:\/\/)?(www\.)?github\.com\/([\w-]+)\/([\w-]+)(\/.*)?$/i;

    if (!githubUrl.match(githubUrlRegex))
    {
        const errorMessage = `Invalid GitHub URL. Please provide a valid GitHub repository URL.\n\nExamples:\n- https://github.com/user/repo\n- https://www.github.com/user/repo`;
        await replyMessage(chatId, errorMessage)
        return false
    }

    // Here, you can proceed with sending the GitHub URL to the database and returning a success message
    // Replace this section with your database logic

    const successMessage = `GitHub repository URL successfully set: ${githubUrl}`;
    await replyMessage(chatId, successMessage, [{
        text: '⏪ Back to Group List',
        callback_data: `group_list`
    }])
    return true;
};

const handleFirstMenu = async (value, chatId, messageId) =>
{
    switch (value)
    {
        case 'link_github':
            await editBotMessage(chatId, messageId, `OK\\!, Send the URL of repository you want to link to this group\\.`);
            setUserSession(chatId, 'link_github')
            break;
        default:
            break;
    }
}

/**
 * Handle incoming callback_query (inline button press)
 * https://core.telegram.org/bots/api#message
 */
const onPrivateCallbackQuery = async (callbackQuery) =>
{
    const parsedData = parseCallData(callbackQuery.data);
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;

    const item = parsedData[parsedData.length - 1]; // select the last calldata

    // Use the item.key and item.value to generate menu items
    switch (item.key)
    {
        case 'group':
            const name = await getGroupDetails(item.value)
            await editBotMessage(chatId, messageId, `Here is your group: *${name}* \nWhat do you want to do?`,
                [{
                    text: 'Link Github Repo',
                    callback_data: `${callbackQuery.data},menu:link_github`
                }]
            )
            break;
        case 'menu':
            await handleFirstMenu(item.value, chatId, messageId)
            break;
        // Handle other keys as needed
        default:
            console.log(`Unknown key: ${item.key}`);
            break;
    }
}

module.exports = {
    onPrivateCallbackQuery,
    handleSetGithubRepo
}