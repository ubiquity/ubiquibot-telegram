const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const addTelegramBot = async (chatId, fromId, groupName) =>
{
    try
    {
        const { data, error } = await supabase.from("telegram_bot_groups").select().eq('from_id', fromId).eq('id', chatId)
        if (data)
        {
            const key = data.id;
            await supabase
                .from("telegram_bot_groups")
                .upsert({
                    id: key,
                    group_name: groupName,
                    from_id: fromId,
                    github_repo: data.github_repo
                })
        } else if (error)
        {
            await supabase.from("telegram_bot_groups").insert({
                id: chatId,
                group_name: groupName,
                from_id: fromId,
                github_repo: ""
            })
        }
    } catch (error)
    {
        console.log(error)
    }
}

const getTelegramBotByFromId = async (fromId) =>
{
    try
    {
        const { data, error } = await supabase.from("telegram_bot_groups").select().eq('from_id', fromId);

        return { data, error }
    } catch (error)
    {
        console.log(error)
    }
}

const removeTelegramBot = async (chatId, fromId) =>
{
    try
    {
        const { data, error } = await supabase.from("telegram_bot_groups").delete().eq('id', chatId).eq('from_id', fromId);

        return { data, error }
    } catch (error)
    {
        console.log(error)
    }
}

module.exports = {
    addTelegramBot,
    removeTelegramBot,
    getTelegramBotByFromId
}