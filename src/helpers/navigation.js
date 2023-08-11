const { getGroupDetails } = require("./telegram");
const { editBotMessage } = require("./triggers");
const { parseCallData } = require("./utils");

/**
 * Handle incoming callback_query (inline button press)
 * https://core.telegram.org/bots/api#message
 */
const onPrivateCallbackQuery = async (callbackQuery) =>
{
    const parsedData = parseCallData(callbackQuery.data);
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;

    console.log(callbackQuery)

    for (const item of parsedData)
    {
        // Use the item.key and item.value to generate menu items
        switch (item.key)
        {
            case 'group':
                const name = await getGroupDetails(item.value)
                const res = await editBotMessage(chatId, messageId, `Here it your group: ${name} \nWhat do you want to do?`, [{
                    text: 'Link Github Repo',
                    callback_data: `${callbackQuery.data},menu:link_github`
                }])
                console.log(res);
                break;
            case 'menu':
                console.log(`Menu: ${item.value}`);
                break;
            // Handle other keys as needed
            default:
                console.log(`Unknown key: ${item.key}`);
                break;
        }
    }
}

module.exports = {
    onPrivateCallbackQuery
}