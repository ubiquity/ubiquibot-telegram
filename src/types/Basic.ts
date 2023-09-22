export type RepoType = {
  group: number;
  github: string;
};

export type ApiParam = {
  chat_id?: number;
  message_id?: number;
  text?: string;
  parse_mode?: "MarkdownV2";
  reply_to_message_id?: number;
  reply_markup?: string;
  callback_query_id?: number;
  url?: string;
  secret_token?: string;
  channel?: number;
  commands?: {
    command: string;
    description: string;
  }[];
  language_code?: string;
  scope?: {
    type: string;
  };
};

export type DataType = {
  callback_query_id: number;
  text?: string;
};

export type MessageType = {
  message_id: number;
  text: string;
  chat: {
    id: number;
    type: string;
  };
  from: {
    id: number;
    username: string;
  };
  reply_to_message: {
    forum_topic_created: {
      name: string;
    };
  };
};

export type ChannelMessageType = {
  message_id: number;
  text: string;
  chat: {
    id: number;
    type: string;
  };
  from: {
    id: number;
  };
};

export type CallbackQueryType = {
  id: number;
  data: string;
  from: {
    username: string;
    id: number;
  };
  message: {
    reply_to_message: {
      from: {
        username: string;
      };
      message_id: number;
      text: string;
      forum_topic_created: {
        name: string;
      };
    };
    chat: {
      id: number;
      type: string;
    };
    message_id: number;
    text: string;
  };
};

export type ParsedDataType = {
  key: string;
  value: number | string;
};

export type KeyboardDataType = {
  text: string;
  callback_data: string;
};

export type MyChatQueryType = {
  new_chat_member: {
    status: string;
    user: {
      username: string;
    };
  };
  old_chat_member: {
    status: string;
    user: {
      username: string;
    };
  };
  chat: {
    id: number;
    title: string;
  };
  from: {
    id: number;
  };
};

export type UpdateType = {
  message: MessageType;
  callback_query: CallbackQueryType;
  my_chat_member: MyChatQueryType;
  channel_post: ChannelMessageType;
};

export interface FetchEventType extends Event {
  request: Request;
  respondWith(response: Promise<Response> | Response): Promise<Response>;
}

export interface ExtendableEventType extends FetchEventType {
  waitUntil(fn: Promise<unknown>): void;
}

export type ErrorType = {
  message: string;
};

export type TaskInfoType = {
  title: string | null;
  orgName: string | null;
  repoName: string | null;
  timeEstimate: string | null;
};
