import { supabase } from "./supabase";

export const setUserSession = async (key: number | string, value: string | object) => {
  await supabase.from('sessions').upsert([{ key, value }]);
};

export const getUserSession = async (key: number | string) => {
  const { data, error } = await supabase.from('sessions').select().eq('key', key).single();
  if (error) {
    console.error(error);
    return null;
  }
  return data?.value;
};

export const hasUserSession = async (key: number | string) => {
  const { data } = await supabase.from('sessions').select('key').eq('key', key);
  return data && data.length > 0;
};

export const deleteUserSession = async (key: number | string) => {
  await supabase.from('sessions').delete().eq('key', key);
};