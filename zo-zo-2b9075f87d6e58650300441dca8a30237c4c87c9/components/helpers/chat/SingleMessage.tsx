import { Text } from "@/components/ui";
import { ChatMessage } from "@/definitions/thread";
import { openLink } from "@/utils/chat";
import { isValidString } from "@/utils/data-types/string";
import { triggerFeedBack } from "@/utils/haptics";
import { formatNickname } from "@/utils/profile";
import React, { useCallback, useMemo } from "react";

interface SingleMessageProps {
  message: ChatMessage;
  isSilenced: boolean;
  handleLongPress: () => void;
  handleReactionPress: (
    messageId: string,
    reaction: string,
    action: "add" | "remove"
  ) => void;
  handleReactionLongPress: (reaction: string) => void;
  showImageModal: () => void;
}

const SingleMessage: React.FC<SingleMessageProps> = ({
  message,
  isSilenced,
  handleLongPress,
  handleReactionPress,
  handleReactionLongPress,
  showImageModal,
}) => {
  const isEmojisOnly = useMemo(() => {
    if (!isValidString(message.body.text)) {
      return false;
    }
    const withoutSpacesText = message.body.text.replace(/\s/g, "");

    return (
      (withoutSpacesText.match(Regex.ChatEmoji)?.length || 0) * 2 ===
        withoutSpacesText.length && withoutSpacesText.length <= 10
    );
  }, [message.body.text]);

  const getMentionedText = useCallback(
    (bodyText: string) => {
      const newBodyText = bodyText.replace(Regex.ChatMention, (match, id) => {
        const user = message?.mentions?.find((mention) => mention.id === id);
        if (user) {
          if (user.id === message.__extras?.accountId) {
            return "You";
          } else {
            return `@${formatNickname(user.profile.nickname)}`;
          }
        }
        return match;
      });
      if (newBodyText.includes("You")) {
        return newBodyText.replace("was", "were");
      }
      return newBodyText;
    },
    [message?.mentions]
  );

  const handleMentionRender = useCallback(
    (matchingString: string, matches: string[]) => {
      const id = matches[1];
      const user = message.mentions?.find((mention) => mention.id === id);
      if (user) {
        return (
          <Text key={user.id} type="SubtitleHighlight" color="ButtonSecondary">
            @{formatNickname(user.profile.nickname)}
          </Text>
        );
      }
      return matchingString;
    },
    [message.mentions]
  );

//   const textParsers = useMemo(
//     () => [
//       {
//         type: "email",
//         style: styles.textLink,
//         onPress: openLink.bind(null, "email"),
//       },
//       {
//         type: "phone",
//         style: styles.textLink,
//         onPress: openLink.bind(null, "mobile"),
//       },
//       {
//         pattern: Regex.ChatURL,
//         style: styles.textLink,
//         onPress: openLink.bind(null, "link"),
//       },
//       {
//         pattern: Regex.ChatMention,
//         style: styles.mentionText,
//         renderText: handleMentionRender,
//       },
//       { pattern: /\bZo\b|\bzo\b/, style: styles.textSymbol, onPress: () => {} },
//     ],
//     [handleMentionRender]
//   );

  const handleReaction = useCallback(
    (reaction: string) => {
      if (handleReactionPress) {
        triggerFeedBack();
        if (message.reactions.mine.includes(reaction)) {
          handleReactionPress(message.id, reaction, "remove");
        } else {
          handleReactionPress(message.id, reaction, "add");
        }
      }
    },
    [handleReactionPress, message.id, message.reactions.mine]
  );

  return null;
};

const Regex = {
  ChatMention:
    /\[mention:([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\]/,
  ChatURL: /(\b(https?|ftp):\/\/[\w.-]+(?:\.[\w\.-]+)+(:\d+)?)([^\s]*)/,
  ChatEmoji:
    /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/gi,
};

export default SingleMessage;
