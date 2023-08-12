const { setUserSession } = require("./session");
const { getGroupDetails, listGroupsWithBot } = require("./telegram");
const { editBotMessage } = require("./triggers");
const { parseCallData } = require("./utils");

const handleFirstMenu = async (value, chatId, messageId, groupData) =>
{
    switch (value)
    {
        case 'link_github':
            await editBotMessage(chatId, messageId, `OK!, Send the URL of repository you want to link to this group.`);
            setUserSession(chatId, { v: 'link_github', c: groupData })
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
    const fromId = callbackQuery.from.id;

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
            const groupData = parsedData[0];
            await handleFirstMenu(item.value, chatId, messageId, groupData.value)
            break;
        case 'group_list':
            await listGroupsWithBot(fromId, chatId, messageId)
        default:
            console.log(`Unknown key: ${item.key}`);
            break;
    }
}

module.exports = {
    onPrivateCallbackQuery,
}