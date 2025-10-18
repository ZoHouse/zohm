import { GeneralObject } from "./general";

export interface Thread {
  category: "group-chat" | "direct-message";
  icon: string;
  id: string;
  num_recipients: number;
  title: string;
  latest_message?: ChatMessage;
}

export type SocketMessageRequest = {
  context: string;
  ref_id: string;
  payload?: SocketMessageRequestPayload;
  action: string;
};

export type SocketMessageRequestPayload = {
  body?: ChatMessageRequestBody;
  attachment_ids?: string[];
  __data?: GeneralObject;
  value?: string;
};

export type ChatMessageRequestBody = {
  text: string;
  embeds: ChatMessageEmbed[];
};

export type SocketMessageResponse = {
  context: string;
  ref_id?: string;
  payload: SocketMessageResponsePayload;
  action: string;
};

export type SocketMessageResponsePayload = SocketMessagePaginatedResponse &
  ChatMessage &
  SocketMessageErrorResponse &
  SocketMesssageReceiptResponse;

export type SocketMessagePaginatedResponse = {
  count: number;
  results: ChatMessage[];
};

export type SocketMesssageReceiptResponse = {
  message: string;
  account: ChatMessageUser;
  seen_at: string | null;
  delivered_at: string | null;
};

export type SocketMessageErrorResponse = {
  errors: string;
};

export type ChatThread = {
  category: "group-chat" | "direct-message";
  icon: string;
  id: string;
  num_recipients: number;
  title: string;
  latest_message?: ChatMessage;
};

export type ChatMessage = {
  id: string;
  thread: string;
  category: "conversation" | "information";
  sender: ChatMessageUser;
  body: ChatMessageResponseBody;
  timestamp: string;
  status: "sent" | "delivered" | "seen";
  attachments: ChatMessageAttachment[];
  mentions: ChatMessageUser[];
  reactions: ChatMessageReactions;
  in_reply_to: string | null;
  type: "sent" | "received" | "info";
  receipt: ChatMessageReceipt;
  __data?: GeneralObject;
  __extras?: GeneralObject;
};

export type ChatRole = {
  id: string;
  label: "owner";
};

export type ChatUser = {
  account: ChatMessageUser;
  role: ChatRole | null;
};

export type ChatMessageUser = {
  id: string;
  is_online?: boolean;
  profile: {
    data?: GeneralObject;
    nickname: string;
    avatar?: string;
    name: string;
    bio: string;
    pfp?: string;
    banner?: string;
  };
};

export type ChatMessageAttachment = {
  category: "video" | "image";
  id: string;
  metadata: {
    aspect_ratio: number;
    aspectRatio: number;
  };
  sort_index: number;
  url: string;
};

export type ChatMessageResponseBody = {
  text: string;
  embeds: ChatMessageEmbed[];
};

export type ChatMessageEmbed = {
  category: "gif" | "sticker";
  url: string;
  metadata: {
    aspect_ratio: number;
  };
};

export type ChatMessageReceipt = {
  delivered_at: string | null;
  seen_at: string | null;
};

export type ChatMessageReactions = {
  mine: string[];
  summary: ChatMessageReactionSummary[];
};

export type ChatMessageReactionSummary = { count: number; value: string };

export type ChatMedia = {
  category: "image" | "video";
  url: string;
  id: string;
  metadata?: {
    aspect_ratio: number;
  };
};

export type ChatMediaImage = {
  alt_text: string;
  description?: string;
  id: string;
  image: string;
  priority?: number;
  title: string;
};

export type ChatMediaVideo = {
  alt_text: string;
  description: string;
  id: string;
  priority: number;
  relation_id: number;
  relation_type: number;
  time_create: string;
  time_update: string;
  title: string;
  video: string;
};
