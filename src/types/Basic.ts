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
  };
};

export type CallbackQueryType = {
  id: number;
  data: string;
  from: {
    username: string;
  };
  message: {
    reply_to_message: {
      from: {
        username: string;
      };
      message_id: number;
      text: string;
    };
    chat: {
      id: number;
    };
    message_id: number;
    text: string;
  };
};

export type UpdateType = {
  message: MessageType;
  callback_query: CallbackQueryType;
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
