import { useComm } from "@/context/CommProvider";
import {
  ChatMessage,
  SocketMessageRequest,
  SocketMessageRequestPayload,
} from "@/definitions/thread";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useQuery from "@/hooks/useQuery";
import { logAxiosError } from "@/utils/network";
import { SearchResult } from "@/definitions/general";
import {
  fillImportantValues,
  getUpdatedMessagesWithReaction,
  getUpdatedMessagesWithStatusChange,
  insertMessage,
  sendDeliveredIfNot,
  sendSeenIfNot,
} from "@/utils/chat";
import { isValidString } from "@/utils/data-types/string";
import { randomUUID as v4 } from "expo-crypto";

const useChatMessages = (id: string) => {
  const { sendSocketMessage, message } = useComm();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasNewMessages, setHasNewMessages] = useState<boolean>(false);

  const { data: accountId } = useQuery("COMMS_ME", {
    select: (data) => data.data.id,
  });

  const { isLoading, data: fetchedMessages } = useQuery<
    "COMMS_THREADS",
    SearchResult<ChatMessage>,
    ChatMessage[]
  >(
    "COMMS_THREADS",
    {
      enabled: !!accountId,
      select: (data) => data.data.results,
      throwOnError: (er) => {
        return false;
      },
    },
    {
      path: [id, "messages"],
      search: {
        limit: "25",
      },
    }
  );

  const sendMessage = useCallback(
    (
      context: string,
      action: string,
      ref_id?: string,
      messagePayload?: SocketMessageRequestPayload
    ) => {
      // console.log("sendMessage", context, action, messagePayload);
      const _socketMessage: SocketMessageRequest = {
        context: `threads/${id}/${context}`,
        action,
        ref_id: isValidString(ref_id) ? String(ref_id) : v4(),
      };
      if (messagePayload) {
        _socketMessage.payload = messagePayload;
      }
      sendSocketMessage(_socketMessage);
    },
    [sendSocketMessage, id]
  );

  const handleDelivered = useCallback(
    (messageId: string) => {
      sendMessage(`messages/${messageId}/receipts/`, "delivered");
    },
    [sendMessage]
  );

  const hasNoMoreEarlierMessages = useRef(true);
  const hasScrolledUp = useRef(false);

  useEffect(() => {
    if (fetchedMessages?.length && accountId) {
      setMessages(fillImportantValues(fetchedMessages, accountId));
      sendDeliveredIfNot(fetchedMessages, accountId, handleDelivered);
      hasNoMoreEarlierMessages.current = fetchedMessages.length < 20;
    }
  }, [fetchedMessages, accountId]);

  const handleSeen = useCallback(
    (messageId: string) => {
      sendMessage(`messages/${messageId}/receipts/`, "seen");
    },
    [sendMessage]
  );

  const scrollToBottom = useCallback(() => {}, []);

  useEffect(() => {
    if (message && accountId) {
      if (
        message.context === `threads/${id}/messages/` &&
        message.action === "create"
      ) {
        if (hasScrolledUp.current) {
          setHasNewMessages(true);
        } else {
          scrollToBottom();
        }
        if (message.payload) {
          setMessages((_messages) => {
            const newMessages = insertMessage(
              _messages,
              message.payload as ChatMessage,
              message.ref_id || ""
            );
            return fillImportantValues(newMessages, accountId);
          });
          sendDeliveredIfNot([message.payload], accountId, handleDelivered);
          sendSeenIfNot([message.payload], accountId, handleSeen);
        }
      }
      if (
        message.context.startsWith(`threads/${id}`) &&
        message.context.endsWith("/reactions/")
      ) {
        if (message.action === "add" || message.action === "remove") {
          setMessages((_messages) =>
            getUpdatedMessagesWithReaction(
              _messages,
              message.payload,
              message.action as any,
              (message.payload as any)?.account?.id === accountId
            )
          );
        }
      }
      if (
        message.context.startsWith(`threads/${id}`) &&
        message.context.endsWith("/receipts/")
      ) {
        if (message.action === "delivered" || message.action === "seen") {
          const messageId = message.context
            .replace(`threads/${id}/messages/`, "")
            .replace("/receipts/", "");
          setMessages((_messages) =>
            getUpdatedMessagesWithStatusChange(
              _messages,
              messageId,
              message.action as any,
              message.payload.seen_at,
              message.payload.delivered_at
            )
          );
        }
      }
      if (
        message.context.startsWith(`threads/${id}/messages/`) &&
        message.action === "delete"
      ) {
        const messageToBeDeletedId = message.context
          .split(`threads/${id}/messages/`)[1]
          ?.split("/")[0];

        setMessages((_messages) =>
          _messages.findIndex((_m) => _m.id === messageToBeDeletedId) !== -1
            ? fillImportantValues(
                _messages.filter((_m) => _m.id !== messageToBeDeletedId),
                accountId
              )
            : _messages
        );
        if (messages.length > 0) {
          if (messageToBeDeletedId === messages[messages.length - 1]?.id) {
            if (!hasScrolledUp.current) {
              setTimeout(scrollToBottom, 100);
            }
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, id]);

  return useMemo(
    () => ({
      messages,
      sendMessage,
      hasNoMoreEarlierMessages,
      // handleScroll,
      // listRef,
      // onTopReached,
      hasNewMessages,
      scrollToBottom,
      isLoading,
    }),
    [
      messages,
      // handleScroll,
      sendMessage,
      hasNewMessages,
      isLoading,
    ]
  );
};

export default useChatMessages;
