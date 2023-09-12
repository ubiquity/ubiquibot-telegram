import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const addTelegramBot = async (chatId: number, fromId: number, groupName: string) => {
  try {
    const { data, error } = await supabase.from("telegram_bot_groups").select().eq("from_id", fromId).eq("id", chatId);

    if (data && data.length > 0) {
      const { github_repo, key, created_at } = data[0].id;
      await supabase.from("telegram_bot_groups").upsert({
        id: key,
        group_name: groupName,
        from_id: fromId,
        github_repo: github_repo,
        updated_at: new Date().toUTCString(),
        created_at: created_at,
      });
    } else if ((data && data.length === 0) || error) {
      await supabase.from("telegram_bot_groups").insert({
        id: chatId,
        group_name: groupName,
        from_id: fromId,
        github_repo: "",
        created_at: new Date().toUTCString(),
        updated_at: new Date().toUTCString(),
      });
    }
  } catch (error) {
    console.log(error);
  }
};

export const getTelegramBotByFromId = async (fromId: number) => {
  try {
    const { data, error } = await supabase.from("telegram_bot_groups").select().eq("from_id", fromId);

    return { data, error };
  } catch (error) {
    console.log(error);
  }
};

export const removeTelegramBot = async (chatId: number, fromId: number) => {
  try {
    const { data, error } = await supabase.from("telegram_bot_groups").delete().eq("id", chatId).eq("from_id", fromId);

    return { data, error };
  } catch (error) {
    console.log(error);
  }
};

export const linkGithubRepoToTelegram = async (fromId: number, chatId: number, github_repo: string) => {
  try {
    const { data, error } = await supabase.from("telegram_bot_groups").select().eq("from_id", fromId).eq("id", chatId);
    if (data && data.length > 0) {
      const { group_name, from_id, id } = data[0];
      await supabase.from("telegram_bot_groups").upsert({
        id,
        group_name,
        from_id,
        github_repo,
        updated_at: new Date().toUTCString(),
      });
    } else if (error) {
      console.log("Error adding github_repo to supabase");
    }
  } catch (error) {
    console.log(error);
  }
};

export const linkGithubRepoToTelegramForum = async (id: number, github_repo: string) => {
  try {
    const { data, error } = await supabase.from("telegram_bot_forums").select().eq("id", id);
    if (data && data.length > 0) {
      const { id, group_id, forum_name, enabled, created_at } = data[0];
      await supabase.from("telegram_bot_forums").upsert({
        id,
        group_id,
        forum_name,
        github_repo,
        enabled,
        created_at,
        updated_at: new Date().toUTCString(),
      });
    } else if (error) {
      console.log("Error adding github_repo to supabase");
    }
  } catch (error) {
    console.log(error);
  }
};

export const getRepoByGroupId = async (groupId: number) => {
  try {
    const { data, error } = await supabase.from("telegram_bot_groups").select("github_repo").eq("id", groupId);
    if (data && data.length > 0) {
      return data[0]?.github_repo;
    } else if (error) {
      console.log("Error adding github_repo to supabase");
      return "";
    }
  } catch (error) {
    console.log(error);
    return "";
  }
};

export const bindGithubToTelegramUser = async (groupId: number, username: string, githubId: string, token: string) => {
  const { data: existingRecord } = await supabase.from("tele_git_users_maps").select("id").eq("user_id", username).eq("group_id", groupId).single();

  const dataObj = {
    user_id: username,
    group_id: groupId,
    github_id: githubId,
    token: token,
    created_at: new Date().toUTCString(),
    updated_at: new Date().toUTCString(),
  };

  if (existingRecord) {
    const { data, error } = await supabase.from("tele_git_users_maps").upsert([
      {
        id: existingRecord!.id,
        ...dataObj,
      },
    ]);

    if (error) {
      console.error("Error updating user:", error.message);
      return null;
    }

    return data;
  } else {
    const { data, error } = await supabase.from("tele_git_users_maps").insert([dataObj]);

    if (error) {
      console.error("Error adding user:", error.message);
      return null;
    }

    return data;
  }
};

export const getUserGithubId = async (github_id: string, groupId: number) => {
  const { data, error } = await supabase.from("tele_git_users_maps").select("github_id").eq("user_id", github_id).eq("group_id", groupId);

  if (error) {
    console.error("Error getting user:", error.message);
    return null;
  }

  if (data.length === 0) {
    return null;
  }

  return data[0].github_id;
};

export const addTopic = async (groupId: number, forumName: string, githubRepo: string, enabled: boolean) => {
  const { data: existingRecord } = await supabase.from("telegram_bot_forums").select("id").eq("group_id", groupId).eq("forum_name", forumName).single();

  const dataObj = {
    group_id: groupId,
    forum_name: forumName,
    github_repo: githubRepo,
    enabled,
    created_at: new Date().toUTCString(),
    updated_at: new Date().toUTCString(),
  };

  if (existingRecord) {
    const { data, error } = await supabase.from("telegram_bot_forums").upsert([
      {
        id: existingRecord!.id,
        ...dataObj,
      },
    ]);

    if (error) {
      console.error("Error updating user:", error.message);
      return null;
    }

    return data;
  } else {
    const { data, error } = await supabase.from("telegram_bot_forums").insert([dataObj]);

    if (error) {
      console.error("Error adding user:", error.message);
      return null;
    }

    return data;
  }
};

export const getTopic = async (groupId: number, forumName: string) => {
  const { data, error } = await supabase.from("telegram_bot_forums").select().eq("group_id", groupId).eq("forum_name", forumName);

  if (error) {
    console.error("Error getting topic:", error.message);
    return null;
  }

  if (data.length === 0) {
    return null;
  }

  return data[0];
};

export const getTopicById = async (topicId: number) => {
  const { data, error } = await supabase.from("telegram_bot_forums").select().eq("id", topicId);

  if (error) {
    console.error("Error getting topic:", error.message);
    return null;
  }

  if (data.length === 0) {
    return null;
  }

  return data[0];
};

export const getTopics = async (groupId: number) => {
  const { data, error } = await supabase.from("telegram_bot_forums").select().eq("group_id", groupId);

  if (error) {
    console.error("Error getting topic:", error.message);
    return null;
  }

  if (data.length === 0) {
    return null;
  }

  return data;
};

export const hasEnabledTopic = async (groupId: number) => {
  const { data, error } = await supabase.from("telegram_bot_forums").select().eq("group_id", groupId).eq("enabled", true);

  if (error) {
    console.error("Error getting topic:", error.message);
    return null;
  }

  if (data.length === 0) {
    return false;
  }

  return true;
};

export const getUserGithubToken = async (github_id: string, groupId: number) => {
  const { data, error } = await supabase.from("tele_git_users_maps").select("token").eq("user_id", github_id).eq("group_id", groupId);

  if (error) {
    console.error("Error getting user:", error.message);
    return null;
  }

  if (data.length === 0) {
    return null;
  }

  return data[0].token;
};
