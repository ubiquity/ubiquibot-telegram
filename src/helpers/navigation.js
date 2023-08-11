const { parseCallData } = require("./utils");

/**
 * Handle incoming callback_query (inline button press)
 * https://core.telegram.org/bots/api#message
 */
const onPrivateCallbackQuery = async (callbackQuery) =>
{
    const data = parseCallData(callbackQuery.data);


}

module.exports = {
    onPrivateCallbackQuery
}