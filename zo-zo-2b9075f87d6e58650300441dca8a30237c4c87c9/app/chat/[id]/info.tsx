import {
  Avatar,
  GradientHeader,
  Iconz,
  Loader,
  Pressable,
  SafeAreaView,
  Text,
} from "@/components/ui";
import Ziew from "@/components/ui/View";
import device from "@/config/Device";
import { ChatUser, Thread } from "@/definitions/thread";
import useInifiteQuery from "@/hooks/useInifiteQuery";
import useQuery from "@/hooks/useQuery";
import { formatNickname } from "@/utils/data-types/string";
import { logAxiosError } from "@/utils/network";
import helpers from "@/utils/styles/helpers";
import { LegendList } from "@legendapp/list";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useRef } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

const ChatInfoScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: recipients,
    isLoading,
    onEndReached,
    hasNextPage,
  } = useInifiteQuery<ChatUser>({
    key: "COMMS_THREADS",
    enabled: true,
    limit: 10,
    path: `${id}/recipients/`,
    disableLogError: true,
  });

  const { data: thread } = useQuery<"COMMS_THREADS", Thread, Thread>(
    "COMMS_THREADS",
    {
      select: (data) => data.data,
      throwOnError: (er) => {
        return false;
      },
    },
    {
      path: [id],
    }
  );

  const scrollY = useSharedValue(0);
  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollY.value = event.nativeEvent.contentOffset.y;
    },
    []
  );

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [-300, 0, 300],
            [-300 / 2, 0, 0],
            "clamp"
          ),
        },
        {
          scale: interpolate(scrollY.value, [-200, 0, 200], [2, 1, 1]),
        },
      ],
    };
  });

  const renderItem = useCallback(({ item }: { item: ChatUser }) => {
    return (
      <Ziew background="Input" style={styles.itemCurve}>
        <Pressable activeOpacity={0.8} style={styles.item}>
          <Avatar
            size={64}
            uri={item.account.profile.avatar || item.account.profile.pfp || ""}
            alt={item.account.profile.name}
          />
          <Text numberOfLines={1} center>
            {item.account.profile.nickname
              ? formatNickname(item.account.profile.nickname)
              : item.account.id}
          </Text>
        </Pressable>
      </Ziew>
    );
  }, []);

  const keyExtractor = useCallback((item: ChatUser) => item.account.id, []);

  // const avatarYStyle = useAnimatedStyle(() => ({
  //   transform: [
  //     { translateY: scrollY.value > 0 ? 0 : scrollY.value },
  //     {
  //       scale: scrollY.value > 0 ? 1 : 1 + Math.abs(scrollY.value / 100),
  //     },
  //   ],
  // }));

  const head = useCallback(
    () =>
      thread ? (
        <SafeAreaView
          safeArea="top"
          style={styles.head}
          onLayout={(event) => {
            console.log("header height ->", event.nativeEvent.layout.height);
          }}
        >
          <Animated.View style={headerAnimatedStyle}>
            <Avatar
              size={72}
              uri={thread.icon}
              alt={thread.title}
              style={styles.avatar}
            />
          </Animated.View>
          <Text type="SectionTitle" style={styles.title}>
            {thread.title}
          </Text>
        </SafeAreaView>
      ) : null,
    []
  );

  const foot = useCallback(
    () => (
      <SafeAreaView safeArea="bottom" style={styles.foot}>
        {hasNextPage ? <Loader /> : null}
      </SafeAreaView>
    ),
    [hasNextPage]
  );

  return (
    <Ziew background style={helpers.stretch}>
      <GradientHeader y={0.6}>
        <View style={styles.header}>
          <Iconz
            name="arrow-left"
            size={24}
            fillTheme="Primary"
            onPress={router.back}
          />
          {thread ? (
            <Text color="Secondary" type="SubtitleHighlight">
              {thread.num_recipients} member
              {thread.num_recipients === 1 ? "" : "s"}
            </Text>
          ) : null}
          {/* <View style={styles.headRight} /> */}
        </View>
      </GradientHeader>
      <View style={helpers.stretch}>
        {isLoading ? (
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            key="chat-info-loader"
            style={helpers.flexCenter}
          >
            <Loader />
          </Animated.View>
        ) : recipients?.length ? (
          <Animated.View
            entering={FadeInDown}
            exiting={FadeOutDown}
            key="chat-info-list"
            style={helpers.stretch}
          >
            <LegendList
              data={recipients}
              numColumns={2}
              renderItem={renderItem}
              style={helpers.stretch}
              contentContainerStyle={styles.list}
              keyExtractor={keyExtractor}
              estimatedItemSize={(device.WINDOW_WIDTH - 48 - 16) / 2}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={head}
              ListFooterComponent={foot}
              onEndReached={onEndReached}
              onEndReachedThreshold={0.32}
              onScroll={onScroll}
            />
          </Animated.View>
        ) : null}
      </View>
    </Ziew>
  );
};

export default ChatInfoScreen;

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 24,
    gap: 16,
  },
  item: {
    width: (device.WINDOW_WIDTH - 48 - 16) / 2,
    aspectRatio: 1,
    borderRadius: 12,
    borderCurve: "continuous",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  itemCurve: {
    borderRadius: 16,
    borderCurve: "continuous",
  },
  foot: {
    padding: 24,
  },
  head: {
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  title: {
    textAlign: "center",
    fontFamily: "Kalam-Bold",
    fontSize: 32,
    lineHeight: undefined,
  },
  avatar: {
    marginTop: 56 + 8,
  },
  header: {
    height: 56,
    paddingHorizontal: 24,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
  },
  headRight: {
    width: 24,
  },
});
