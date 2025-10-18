import { Text } from "@/components/ui";
import { ChatMessage } from "@/definitions/thread";
import useChatMessages from "@/hooks/useChatMessages";
import { LegendList } from "@legendapp/list";
import { useCallback } from "react";
import SingleMessage from "./SingleMessage";

interface ChatMessageProps {
  id: string;
}

const ChatMessages = ({ id }: ChatMessageProps) => {
  const {
    messages,
    sendMessage,
    hasNoMoreEarlierMessages,
    hasNewMessages,
    scrollToBottom,
    isLoading,
  } = useChatMessages(id);

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  const silencedAccounts: string[] = [];
  const handleReactionPress = useCallback(
    (messageId: string, reaction: string, action: "add" | "remove") => {},
    []
  );
  const handleLongPress = useCallback((item: ChatMessage) => {}, []);
  const showImageModal = useCallback((url: string) => {}, []);
  const handleReactionLongPress = useCallback((item: ChatMessage) => {}, []);

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <SingleMessage
        message={item}
        isSilenced={(silencedAccounts || []).includes(item.sender.id)}
        handleReactionPress={handleReactionPress}
        handleLongPress={handleLongPress.bind(null, item)}
        showImageModal={showImageModal.bind(null, item.attachments?.[0]?.url)}
        handleReactionLongPress={handleReactionLongPress.bind(null, item)}
      />
    ),
    []
  );

  return (
    <LegendList
      alignItemsAtEnd
      // maintainScrollAtEnd
      // maintainScrollAtEndThreshold={0.1}
      data={messages}
      keyExtractor={keyExtractor}
      renderItem={({ item }) => <Text>{item.body.text}</Text>}
    />
  );
};

export default ChatMessages;
