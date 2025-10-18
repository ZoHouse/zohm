import { ChatListShimmer } from "@/components/helpers/chat/Shimmer";
import {
  Avatar,
  Divider,
  GradientHeader,
  Iconz,
  NoContent,
  Pressable,
  SafeAreaView,
  Text,
} from "@/components/ui";
import Ziew from "@/components/ui/View";
import { Thread } from "@/definitions/thread";
import useAppState from "@/hooks/useAppState";
import useProfile from "@/hooks/useProfile";
import useQuery from "@/hooks/useQuery";
import { getMentionRenderedText } from "@/utils/chat";
import { formatNickname, isValidString } from "@/utils/data-types/string";
import helpers from "@/utils/styles/helpers";
import { LegendList } from "@legendapp/list";
import { useIsFocused } from "@react-navigation/native";
import { router } from "expo-router";
import moment from "moment";
import { memo, useCallback, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOutDown,
} from "react-native-reanimated";

const ChatListScreen: React.FC = () => {
  const { data: silencedAccounts } = useQuery("COMMS_SILENCED_ACCOUNTS", {
    select: (data) => data.data.results.map((user) => user.id),
  });

  const {
    data: threads,
    refetch,
    isLoading,
  } = useQuery("COMMS_THREADS", {
    select: (data) => data.data.results,
  });

  const isFocused = useIsFocused();
  const appState = useAppState();

  useEffect(() => {
    if (appState === "active" && isFocused) {
      refetch();
    }
  }, [appState, isFocused]);

  const keyExtractor = useCallback((item: Thread) => item.id, []);

  const { profile } = useProfile();

  const navigate = useCallback((thread: Thread) => {
    router.push(`/chat/${thread.id}`);
  }, []);

  const renderItem = useCallback(({ item }: { item: Thread }) => {
    return (
      <Pressable style={styles.row} onPress={() => navigate(item)}>
        <Avatar alt={item.title} size={48} uri={item.icon} />
        <View style={helpers.flex}>
          <View style={styles.itemTopRow}>
            <View style={styles.itemHeadText}>
              <Text type="TextHighlight" numberOfLines={1}>
                {formatNickname(item.title)}
              </Text>
            </View>
            {item.latest_message && (
              <Text type="Tertiary" color="Secondary">
                {moment(item.latest_message?.timestamp).isSame(moment(), "day")
                  ? moment(item.latest_message?.timestamp).format("hh:mm A")
                  : moment(item.latest_message?.timestamp).isSame(
                      moment().subtract(1, "day"),
                      "day"
                    )
                  ? "Yesterday"
                  : moment(item.latest_message?.timestamp).format("DD/MM/YY")}
              </Text>
            )}
          </View>
          {item.latest_message && (
            <>
              <Text type="Subtitle" numberOfLines={1}>
                {item.category === "group-chat"
                  ? isValidString(item.latest_message?.sender.id)
                    ? `${formatNickname(
                        item.latest_message?.sender.profile.nickname
                      )}: `
                    : ""
                  : ""}
                {(silencedAccounts || []).includes(
                  item.latest_message?.sender.id
                )
                  ? "Blocked Message"
                  : isValidString(item.latest_message?.body.text)
                  ? getMentionRenderedText(
                      item.latest_message?.body.text,
                      item.latest_message?.mentions,
                      item.latest_message?.category,
                      profile?.nickname ?? ""
                    )
                  : (item.latest_message?.attachments || []).length > 0
                  ? item.latest_message?.attachments[0].category
                  : "Sticker"}
              </Text>
            </>
          )}
        </View>
      </Pressable>
    );
  }, []);

  return (
    <Ziew style={helpers.stretch} background>
      <GradientHeader y={0.5}>
        <View style={styles.head}>
          <Text type="Title" style={styles.title}>
            Common Room
          </Text>
          <Pressable style={styles.headLeft} onPress={router.back}>
            <Iconz name="arrow-left" size={24} fillTheme="Primary" />
          </Pressable>
        </View>
      </GradientHeader>
      <View style={helpers.stretch}>
        {isLoading ? (
          <Animated.View
            style={helpers.stretch}
            entering={FadeInDown}
            key="chat-list-shimmer"
            exiting={FadeOutDown}
          >
            <ChatListShimmer />
          </Animated.View>
        ) : threads?.length ? (
          <Animated.View
            style={helpers.stretch}
            entering={FadeInDown}
            key="chat-list"
          >
            <LegendList
              data={threads}
              style={helpers.stretch}
              contentContainerStyle={styles.list}
              recycleItems
              estimatedItemSize={80}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              ListHeaderComponent={ListHead}
              ItemSeparatorComponent={Separator}
            />
          </Animated.View>
        ) : (
          <ListEmpty />
        )}
      </View>
    </Ziew>
  );
};

const Separator = memo(() => <Divider />);

const ListEmpty = memo(() => {
  return (
    <View style={helpers.flexCenter}>
      <NoContent
        source={require("@/assets/lottie/chat-empty.json")}
        title="Chats with hosts and travellers!"
        subtitle={`Make a booking to start chatting.\nChat opens after check-in.`}
        btnProps={{
          title: "Make a booking",
          onPress: router.back,
        }}
      />
    </View>
  );
});

const ListHead = memo(() => (
  <SafeAreaView safeArea="top">
    <View style={styles.headEmpty} />
  </SafeAreaView>
));

export default ChatListScreen;

const styles = StyleSheet.create({
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    paddingHorizontal: 24,
  },
  headEmpty: {
    height: 56,
  },
  title: {
    fontFamily: "Kalam-Bold",
    marginTop: 8,
  },
  headLeft: {
    position: "absolute",
    left: 0,
    height: "100%",
    justifyContent: "center",
    paddingLeft: 24,
  },
  list: {
    paddingHorizontal: 24,
  },
  row: {
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  itemTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  itemHeadText: {
    flexDirection: "row",
    flex: 1,
  },
});
