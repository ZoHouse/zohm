import React from "react";
import moment from "moment";
import { StyleSheet, View } from "react-native";
import Animated, {
  FadeInDown,
  FadeOutDown,
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from "react-native-reanimated";
import { router, useLocalSearchParams } from "expo-router";
import { GradientHeader, Iconz, Loader, SafeAreaView } from "@/components/ui";
import RenderHTMLBlog from "@/components/ui/RenderHTMLBlog";
import Text from "@/components/ui/Text";
import Ziew from "@/components/ui/View";
import ZoImage from "@/components/ui/ZoImage";
import device from "@/config/Device";
import { Blog } from "@/definitions/blogs";
import useQuery from "@/hooks/useQuery";
import { logAxiosError } from "@/utils/network";
import helpers from "@/utils/styles/helpers";

const HEADER_HEIGHT = device.WINDOW_WIDTH / 1.5;

const BlogDetailScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data } = useQuery<"BLOG", { blogs: Blog }, Blog>(
    "BLOG",
    {
      select: (data) => data.data.blogs,
      enabled: !!id,
      throwOnError: (er) => {
        logAxiosError(er);
        return false;
      },
    },
    {
      path: ["posts", id],
    }
  );

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollViewOffset(scrollRef);

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [-HEADER_HEIGHT / 2, 0, 0]
          ),
        },
        {
          scale: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [2, 1, 1]
          ),
        },
      ],
    };
  });

  return (
    <Ziew style={helpers.stretch} background>
      <GradientHeader>
        <View style={styles.head}>
          <Iconz
            name="arrow-left"
            size={24}
            fillTheme="Primary"
            onPress={router.back}
          />
        </View>
      </GradientHeader>
      <Animated.ScrollView
        style={helpers.flex}
        ref={scrollRef}
        contentContainerStyle={styles.content}
      >
        <SafeAreaView safeArea="top" />
        <View style={styles.head} />
        {data ? (
          <Animated.View entering={FadeInDown} exiting={FadeOutDown} key="blog">
            <SafeAreaView safeArea="bottom" style={styles.info}>
              <Animated.View style={[styles.cover, headerAnimatedStyle]}>
                <ZoImage url={data.cover_image} width="m" />
              </Animated.View>
              <Text type="Title" style={styles.title}>
                {data.title}
              </Text>
              <View>
                <Text type="SubtitleHighlight" color="Secondary">
                  ✍️{"  "}
                  {data.author},{" "}
                  {moment(data.time_create).format("DD MMM YYYY")}
                </Text>
              </View>
              <RenderHTMLBlog html={data.content} />
            </SafeAreaView>
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeInDown}
            exiting={FadeOutDown}
            key="blog-load"
            style={styles.load}
          >
            <Loader />
          </Animated.View>
        )}
      </Animated.ScrollView>
    </Ziew>
  );
};

export default BlogDetailScreen;

const styles = StyleSheet.create({
  head: {
    height: 56,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  content: {
    paddingHorizontal: 24,
  },
  info: {
    flex: 1,
    gap: 16,
    marginBottom: 16,
  },
  title: {
    fontFamily: "Kalam-Bold",
  },
  cover: {
    width: device.WINDOW_WIDTH,
    aspectRatio: 1.5,
    overflow: "hidden",
    marginHorizontal: -24,
    borderCurve: "continuous",
  },
  load: {
    height: device.WINDOW_HEIGHT / 2,
    justifyContent: "center",
    alignItems: "center",
  },
});
