import { GradientHeader, Iconz, Pressable, Text } from "@/components/ui";
import { Thread } from "@/definitions/thread";
import useQuery from "@/hooks/useQuery";
import helpers from "@/utils/styles/helpers";
import { Image } from "expo-image";
import { router } from "expo-router";
import { memo, useCallback } from "react";
import { StyleSheet, View } from "react-native";

const ChatHead = ({ id }: { id: string }) => {
  const { data: thread } = useQuery<"COMMS_THREADS", Thread, Thread>(
    "COMMS_THREADS",
    {
      select: (data) => data.data,
    },
    {
      path: [id],
    }
  );

  const showInfo = useCallback(() => {
    if (thread?.category === "group-chat") {
      router.push(`/chat/${id}/info`);
    }
  }, [thread?.category, id]);

  return (
    <GradientHeader y={0.5}>
      <View style={styles.head}>
        <Pressable activeOpacity={0.8} onPress={router.back}>
          <Iconz name="arrow-left" size={24} fillTheme="Primary" />
        </Pressable>
        {thread ? (
          <>
            <Pressable style={helpers.flexCenter} onPress={showInfo}>
              <Text numberOfLines={1} style={styles.title}>
                {thread.title}
              </Text>
              {thread.category === "group-chat" ? (
                <Text type="Subtitle" color="Secondary" numberOfLines={1}>
                  {thread.num_recipients} member
                  {thread.num_recipients > 1 ? "s" : ""}
                </Text>
              ) : null}
            </Pressable>
            <Pressable activeOpacity={0.8} onPress={showInfo}>
              <Image
                style={styles.icon}
                contentFit="contain"
                source={thread.icon}
              />
            </Pressable>
          </>
        ) : (
          <View style={helpers.flex} />
        )}
      </View>
    </GradientHeader>
  );
};

export default memo(ChatHead);

const styles = StyleSheet.create({
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 24,
  },
  icon: {
    width: 24,
    height: 24,
  },
  title: {
    fontFamily: "Kalam-Bold",
    marginBottom: -4,
  },
});
