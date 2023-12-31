import { supabase } from "./supabase";

export async function setUserSession(
  key: number | string,
  value: string | { telegramId?: number; username?: string; group?: number; v?: string; c?: string; k?: string }
) {
  // check for previous session and delete before creating a new one
  if (value && typeof value === "object" && value.telegramId) {
    const { data } = await supabase.from("sessions").select("key").eq("value -> telegramId", value.telegramId).eq("value -> group", value.group);
    if (data && data?.length > 0) {
      await supabase.from("sessions").delete().eq("key", data[0].key);
    }
  }
  await supabase.from("sessions").upsert([{ key, value, created_at: new Date().toUTCString() }]);
}

export async function getUserSession(key: number | string) {
  const { data, error } = await supabase.from("sessions").select().eq("key", key).single();
  if (error) {
    console.error(error);
    return null;
  }
  return data?.value;
}

export async function hasUserSession(key: number | string) {
  const { data } = await supabase.from("sessions").select("key").eq("key", key);
  return data && data.length > 0;
}

export async function deleteUserSession(key: number | string) {
  await supabase.from("sessions").delete().eq("key", key);
}
