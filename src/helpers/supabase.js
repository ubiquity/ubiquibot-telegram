const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const getPermits = async () =>
{
    try
    {
        const { data, error } = await supabase.from("permits").select();
        console.log(data, error)
    } catch (error)
    {
        console.log(error)
    }
}

module.exports = {
    getPermits,
}