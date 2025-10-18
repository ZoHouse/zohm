import { GeneralObject } from "@/definitions/general";
import {
  ChatMedia,
  ChatMessage,
  ChatMessageUser,
  ChatUser,
} from "@/definitions/thread";
import moment from "moment";
import { formatNickname } from "./data-types/string";
import { randomUUID as v4 } from "expo-crypto";
import { getUptoMinutes } from "./data-types/date";
import { Linking } from "react-native";
import { triggerFeedBack } from "./haptics";
import storage from "@/utils/storage";

export const getMentionRenderedText = (
  text: string,
  mentions: ChatMessageUser[],
  category: "conversation" | "information",
  nickname: string
) => {
  let renderedText = text;
  if (mentions.length > 0) {
    mentions.forEach((mention) => {
      const mentionText = `[mention:${mention.id}]`;
      if (mention.profile.nickname === nickname) {
        renderedText = renderedText.replace(mentionText, `You`);
      } else {
        renderedText = renderedText.replace(
          mentionText,
          `@${mention.profile.nickname}`
        );
      }
    });
  }
  if (category === "information" && renderedText.includes("You")) {
    renderedText = renderedText.replace("was", "were");
  }
  return renderedText;
};

export const insertMessage = (
  messages: ChatMessage[],
  message: ChatMessage & GeneralObject,
  ref_id: string
) => {
  const newMessages = [...messages.filter((m) => m.id !== `c-${ref_id}`)];
  let i = 0;
  while (
    i < newMessages.length &&
    moment(message.timestamp).isBefore(newMessages[i].timestamp)
  ) {
    i++;
  }
  const newMessage = { ...message };
  newMessages.splice(i, 0, newMessage);

  return newMessages;
};

export const getUpdatedMessagesWithReaction = (
  messages: ChatMessage[],
  payload: GeneralObject,
  type: "add" | "remove",
  isUser: boolean
) => {
  const newMessages = [...messages];
  let messageIndex = newMessages.findIndex((m) => m.id === payload.message);
  if (messageIndex !== -1) {
    let message = { ...newMessages[messageIndex] };
    const reactionIndex = (message.reactions.summary || []).findIndex(
      (r) => r.value === payload.value
    );
    const reactions = {
      mine: [...(message.reactions.mine || [])],
      summary: [...(message.reactions.summary || [])],
    };
    if (reactionIndex === -1) {
      if (type === "add") {
        if (isUser) {
          reactions.mine.push(payload.value);
        }
        reactions.summary.push({
          value: payload.value,
          count: 1,
        });
      }
    } else {
      if (type === "remove") {
        if (isUser) {
          reactions.mine = reactions.mine.filter((r) => r !== payload.value);
        }
        if (reactions.summary[reactionIndex].count === 1) {
          reactions.summary.splice(reactionIndex, 1);
        } else {
          reactions.summary[reactionIndex] = {
            ...reactions.summary[reactionIndex],
            count: reactions.summary[reactionIndex].count - 1,
          };
        }
      } else {
        if (isUser) {
          reactions.mine = reactions.mine.filter((r) => r !== payload.value);
          reactions.mine.push(payload.value);
        }
        reactions.summary[reactionIndex] = {
          ...reactions.summary[reactionIndex],
          count: reactions.summary[reactionIndex].count + 1,
        };
      }
    }
    message = { ...message, reactions };
    newMessages[messageIndex] = message;
  }
  return [...newMessages];
};

export const getUpdatedMessagesWithStatusChange = (
  messages: ChatMessage[],
  messageId: string,
  status: "sent" | "delivered",
  seenAt: string | null,
  deliveredAt: string | null
) => {
  const newMessages = [...messages];
  let messageIndex = newMessages.findIndex((m) => m.id === messageId);
  if (messageIndex !== -1) {
    let message = { ...newMessages[messageIndex] };
    if (status === "delivered") {
      message = {
        ...message,
        receipt: {
          ...message.receipt,
          delivered_at: deliveredAt,
        },
      };
    } else {
      message = {
        ...message,
        receipt: {
          ...message.receipt,
          seen_at: seenAt,
        },
      };
    }
    newMessages[messageIndex] = message;
  }
  return [...newMessages];
};

export const sendDeliveredIfNot = (
  messages: ChatMessage[],
  accountId: string,
  handleDelivered: (messageId: string) => void
) => {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (
      messages[i].sender.id !== accountId &&
      messages[i].receipt.delivered_at == null &&
      !messages[i].id.startsWith("l-") &&
      !messages[i].id.startsWith("c-")
    ) {
      handleDelivered(messages[i].id);
    }
  }
};

export const sendSeenIfNot = (
  messages: ChatMessage[],
  accountId: string,
  handleSeen: (messageId: string) => void
) => {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (
      messages[i].receipt.seen_at == null &&
      messages[i].sender.id !== accountId &&
      !messages[i].id.startsWith("l-") &&
      !messages[i].id.startsWith("c-")
    ) {
      handleSeen(messages[i].id);
    }
  }
};

export const getMessageWithoutReactions = (message: ChatMessage) => {
  const _message = { ...message };
  _message.reactions.mine = [];
  _message.reactions.summary = [];
  return _message;
};

export const removeTrailingNewLine = (text: string) => {
  return text.trim().replace(/^\n*|\n*$/g, "");
};

export const getMentionsFromText = (text: string, members: ChatUser[]) => {
  // Create a mapping of name to id for easy lookup
  const nameToIdMap = members.reduce((acc, curr) => {
    acc[formatNickname(curr.account.profile.nickname)] = curr.account.id;
    return acc;
  }, {} as Record<string, string>);

  // Create a regex pattern based on names in the list
  const pattern = `@(${[
    ...members.map((item) => formatNickname(item.account.profile.nickname)),
    ...members.map((item) => formatNickname(item.account.profile.nickname)),
  ].join("|")})(?=[^a-zA-Z0-9_]|$)`;
  const regex = new RegExp(pattern, "g");

  return text.replace(regex, (match, name) => {
    return `[mention:${nameToIdMap[name]}]`;
  });
};

export const getMessagesWithReceipts = (messages: GeneralObject[]) => {
  const delivered: GeneralObject[] = [];
  const seen: GeneralObject[] = [];
  messages.forEach((message) => {
    if (message.seen_at) {
      seen.push({ type: "seen", ...message });
    } else if (message.delivered_at) {
      delivered.push({ type: "delivered", ...message });
    }
  });
  return [
    { title: "Read", data: seen.length > 0 ? seen : [{ type: "empty" }] },
    {
      title: "Delivered",
      data: delivered.length > 0 ? delivered : [{ type: "empty" }],
    },
  ];
};

export const fetchMessages = async (
  threadId: string,
  option: "before" | "after",
  messageId: string
) => {
  const accountId = await storage.getData("COMM_ACCOUNT_ID");
  const token = await storage.getData("COMM_TOKEN");
  const appId = await storage.getData("COMM_APP_ID");

  if (!accountId || !token || !appId) {
    return;
  }

  const request = await fetch(
    `${process.env.EXPO_PUBLIC_ZO_API_BASE_URL}/api/v1/comms/threads/${threadId}/messages/?${option}_message_id=${messageId}&limit=20`,
    {
      headers: {
        "app-id": appId,
        "account-id": accountId,
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const response = await request.json();
  console.log(
    "response",
    `/api/v1/comms/threads/${threadId}/messages/?${option}_message_id=${messageId}&limit=20`
  );
  const messages = response.results;

  return { messages, isLast: response.results.count <= 20 };
};

export const getPaddedMessages: () => ChatMessage = () => {
  return {
    id: `x-${v4()}`,
    thread: "threadId",
    category: "conversation",
    type: "sent",
    sender: {
      id: "accountId",
      profile: { nickname: "", name: "", bio: "" },
    },
    status: "sent",
    timestamp: new Date().toISOString(),
    body: {
      text: "",
      embeds: [],
    },
    mentions: [],
    reactions: {
      mine: [],
      summary: [],
    },
    in_reply_to: null,
    receipt: {
      delivered_at: null,
      seen_at: null,
    },
    attachments: [],
  };
};

const getPaddedMedia = (
  url: string,
  category: "image" | "video"
): ChatMedia => {
  return {
    id: "",
    url,
    category,
  };
};

export const fillImportantValues = (messages: ChatMessage[], accountId: string) => {
  const _messages = [...messages];
  _messages.forEach((item, index) => {
    const type =
      item.category === "information"
        ? "info"
        : (item.sender.id || "") === accountId
        ? "sent"
        : "received";

    const hasMoreMessagesAbove =
      index + 1 < messages.length &&
      item.sender.id === messages[index + 1].sender.id &&
      ((item.category === messages[index + 1].category &&
        item.category === "information") ||
        getUptoMinutes(item.timestamp) ===
          getUptoMinutes(messages[index + 1].timestamp));

    const hasMoreMessagesBelow =
      index - 1 >= 0 &&
      item.sender.id === messages[index - 1].sender.id &&
      ((item.category === messages[index - 1].category &&
        item.category === "information") ||
        getUptoMinutes(item.timestamp) ===
          getUptoMinutes(messages[index - 1].timestamp));

    const isNewDay =
      index + 1 < messages.length
        ? moment(item.timestamp).format("LL") !==
          moment(messages[index + 1].timestamp).format("LL")
        : true;

    item.__extras = {
      hasMoreMessagesAbove,
      hasMoreMessagesBelow,
      isNewDay,
      accountId,
    };
    item.type = type;
  });

  return _messages;
};

export const openLink = (type: "email" | "mobile" | "link", url: string) => {
  let _url = url;
  switch (type) {
    case "email":
      _url = `mailto:${url}`;
      break;
    case "mobile":
      _url = `tel:${url}`;
      break;
    default:
      if (!url.startsWith("http")) {
        _url = `https://${url}`;
      }
      break;
  }
  triggerFeedBack();
  Linking.openURL(_url);
};
