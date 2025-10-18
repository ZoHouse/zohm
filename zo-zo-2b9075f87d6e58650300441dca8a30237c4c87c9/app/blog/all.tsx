import React, { useCallback, useMemo } from "react";
import Ziew from "@/components/ui/View";
import helpers from "@/utils/styles/helpers";
import {
  GradientHeader,
  Iconz,
  Loader,
  Pressable,
  SafeAreaView,
  Text,
} from "@/components/ui";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { LegendList } from "@legendapp/list";
import { allQueryEndpoints } from "@/hooks/useQuery";
import { axiosInstances } from "@/utils/auth/client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { logAxiosError } from "@/utils/network";
import { Blog } from "@/definitions/blogs";
import ZoImage from "@/components/ui/ZoImage";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeColors } from "@/context/ThemeContext";
import moment from "moment";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";

const BlogListScreen: React.FC = () => {
  const { data, onEndReached, hasNextPage, isLoading } = useBlogListQuery();

  const [dark] = useThemeColors(["Vibes.Dark"]);
  const gradientColors = useMemo(
    () => [`${dark}00`, `${dark}CC`, dark] as const,
    [dark]
  );

  const onPress = useCallback((item: Blog) => {
    router.push(`/blog/${item.url_slug}`);
  }, []);

  const renderItem = useCallback(({ item }: { item: Blog }) => {
    return (
      <Pressable
        style={styles.blog}
        onPress={() => onPress(item)}
        activeOpacity={0.8}
      >
        <View style={helpers.absoluteEnds}>
          <ZoImage url={item.cover_image} width="sm" id={item.key} />
        </View>
        <View style={styles.gradientContainer}>
          <LinearGradient colors={gradientColors} style={helpers.stretch} />
        </View>
        <View style={helpers.flex} />
        <Text color="Light" style={styles.blogTitle}>
          {item.title}
        </Text>
        <View style={styles.blogAuthorContainer}>
          <Text color="Light" type="Subtitle" style={styles.blogAuthor}>
            ✍️ {item.author}
          </Text>
          <Text color="Light" type="Tertiary" style={styles.blogAuthor}>
            {moment(item.time_create).format("DD MMM YYYY")}
          </Text>
        </View>
      </Pressable>
    );
  }, []);

  const keyExtractor = useCallback((item: Blog) => item.key, []);

  const listHead = useCallback(() => {
    return (
      <SafeAreaView safeArea="top">
        <View style={styles.head} />
      </SafeAreaView>
    );
  }, []);

  const listFoot = useCallback(
    () =>
      hasNextPage ? (
        <View style={styles.load}>
          <Loader />
        </View>
      ) : null,
    [hasNextPage]
  );

  return (
    <Ziew background style={helpers.stretch}>
      <GradientHeader y={0.4}>
        <View style={styles.head}>
          <Iconz
            name="arrow-left"
            size={24}
            fillTheme="Primary"
            onPress={router.back}
          />
          <Text type="Title" style={styles.title}>
            Blogs
          </Text>
          <View style={styles.r} />
        </View>
      </GradientHeader>
      {data ? (
        <Animated.View
          entering={FadeInDown}
          exiting={FadeOutDown}
          key="list"
          style={helpers.stretch}
        >
          <LegendList
            data={data}
            renderItem={renderItem}
            style={helpers.stretch}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.list}
            onEndReached={onEndReached}
            ListHeaderComponent={listHead}
            recycleItems
            ListFooterComponent={listFoot}
          />
        </Animated.View>
      ) : isLoading ? (
        <Animated.View
          entering={FadeInDown}
          exiting={FadeOutDown}
          key="list-load"
          style={helpers.flexCenter}
        >
          <Loader />
        </Animated.View>
      ) : null}
    </Ziew>
  );
};

export default BlogListScreen;

const styles = StyleSheet.create({
  head: {
    height: 56,
    paddingHorizontal: 24,
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexDirection: "row",
    paddingVertical: 4,
  },
  list: {
    paddingHorizontal: 24,
    gap: 16,
    paddingBottom: 72,
  },
  blog: {
    width: "100%",
    aspectRatio: 1.2,
    borderRadius: 16,
    overflow: "hidden",
    borderCurve: "continuous",
    padding: 16,
  },
  r: {
    width: 24,
  },
  title: {
    fontFamily: "Kalam-Bold",
    marginTop: 2,
  },
  blogTitle: {
    fontFamily: "Kalam-Bold",
  },
  gradient: {
    height: "50%",
  },
  gradientContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  blogAuthor: {
    fontFamily: "Kalam-Bold",
    opacity: 0.6,
  },
  blogAuthorContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "space-between",
  },
  load: {
    marginVertical: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});

function useBlogListQuery() {
  const { url, queryKey } = allQueryEndpoints["BLOG"];
  const absoluteURL = url.concat("posts/");
  const axios = axiosInstances.ZOSTEL;

  const {
    data: _data,
    fetchNextPage,
    hasNextPage,
    ...rest
  } = useInfiniteQuery({
    queryKey: [...queryKey, "posts"],
    queryFn: ({ pageParam = 0 }) => {
      return axios
        .get(`${absoluteURL}?per_page=${10}&page=${pageParam}`)
        .then((res) => ({ ...res.data, pageParam }))
        .catch((er) => ({ pageParam }));
    },
    getNextPageParam: (lastPage) => {
      const nextParam = lastPage.blogs ? lastPage.pageParam + 1 : undefined;
      return nextParam;
    },
    enabled: true,
    initialPageParam: 1,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      items: data.pages.flatMap((page) => page.blogs || []),
    }),
    throwOnError: (er) => {
      logAxiosError(er);
      return false;
    },
  });

  const onEndReached = useCallback(() => {
    if (hasNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage]);

  const data = _data?.items as Blog[] | undefined;

  return {
    ...rest,
    data,
    onEndReached,
    hasNextPage,
  };
}
