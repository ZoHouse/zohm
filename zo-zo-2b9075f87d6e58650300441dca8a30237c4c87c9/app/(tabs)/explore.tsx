import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  ViewToken,
} from "react-native";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import device from "@/config/Device";
import useProfile from "@/hooks/useProfile";
import { FeedItem, HomeData, Playlist } from "@/definitions/explore";
import { Loader, SafeAreaView, Text, View } from "@/components/ui";
import {
  ExploreSection,
  SwipeCards,
  ExploreShimmer,
  Footer,
  Header,
} from "@/components/helpers/explore/";
import { useReactiveRef } from "@/utils/hooks";
import { Profile, WhereaboutsV2 } from "@/definitions/profile";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOutDown,
  FadeOutUp,
} from "react-native-reanimated";
import useQuery from "@/hooks/useQuery";
import { LegendList } from "@legendapp/list";
import useDisableAndroidBack from "@/hooks/useDisableAndroidBack";
import ExploreBottomBar from "@/components/helpers/explore/ExploreBottomBar";
import { useScrollToTop } from "@react-navigation/native";
import { useFCM } from "@/components/helpers/misc/fcmHooks";
import helpers from "@/utils/styles/helpers";
import { useSetFeedLoaded, useSetFootStore } from "@/utils/store/explore";
import { triggerSelection } from "@/utils/haptics";

const appStructures = [
  "swipe-cards",
  "standard-horizontal-list",
  "filter",
  "nx3-vertical-list",
  "portrait-horizontal-list",
  "3xn-horizontal-list",
  "banner-logo-text-vertical-list",
  "banner-logo-text-horizontal-list",
  "capsule-horizontal-list",
];

const ListEmptyComponent = memo(() => {
  return (
    <View style={styles.loader}>
      <Loader />
    </View>
  );
});

export default function () {
  const { profile } = useProfile();
  const [location, setLocation] = useState<WhereaboutsV2 | null>(null);

  const [discoverData, setDiscoverData] = useState<HomeData[]>();

  const { isLoading, refetch } = useQuery(
    "DISCOVER_HOME",
    {
      select: (data) => data.data.sections,
    },
    location?.location
      ? {
          search: {
            lat: `${location.location.lat}`,
            lng: `${location.location.long}`,
          },
        }
      : undefined
  );

  const latLng = useMemo(() => {
    if (!location?.location) return null;
    return `${location.location.lat}&${location.location.long}`;
  }, [location]);

  useEffect(() => {
    refetch()
      .then((data) => data.data)
      .then(setDiscoverData);
  }, [latLng, refetch]);

  useDisableAndroidBack();

  const isReloading = useMemo(
    () => Boolean(discoverData && isLoading),
    [discoverData, isLoading]
  );

  const feedData = useMemo(() => {
    const list: FeedItem[] = [];
    if (!discoverData) return null;
    discoverData.forEach((el) => {
      el.playlists = el.playlists.filter((pl) =>
        appStructures.includes(pl.structure)
      );
    });
    discoverData
      .forEach((section, sectionIndex) => {
        if (!section.playlists.length) return;
        if (section.title) {
          list.push({
            title: section.title,
            subtitle: section.subtitle,
            id: section.id,
            _type: "head",
          });
        }
        section.playlists.forEach((playlist) => {
          const pl = playlist as Playlist;
          list.push({
            ...pl,
            id: `${pl.id}-${sectionIndex}`,
            _type: "playlist",
          });
        });
      });
    return list;
  }, [discoverData]);

  return (
    <View background style={styles.screen}>
      {feedData?.length && profile ? (
        <Animated.View key="feed" style={styles.screen} entering={FadeInDown}>
          <MemoExplore
            profile={profile}
            feed={feedData}
            location={location}
            setLocation={setLocation}
            isReloading={isReloading}
          />
          <ExploreBottomBar />
        </Animated.View>
      ) : (
        <Animated.View
          key="shimmer"
          style={styles.screen}
          exiting={FadeOutDown}
        >
          <ExploreShimmer />
        </Animated.View>
      )}
    </View>
  );
}

interface ExploreProps {
  profile: Profile;
  feed: FeedItem[];
  location: WhereaboutsV2 | null;
  setLocation: (location: WhereaboutsV2 | null) => void;
  isReloading: boolean;
}

const LIMIT = Platform.select({
  android: 3,
  default: 4,
});

function Explore({
  profile,
  feed,
  location,
  setLocation,
  isReloading,
}: ExploreProps) {
  const [feedIndex, setFeedIndex] = useState(LIMIT);

  const feedLength = useReactiveRef(feed.length);

  const renderSwipeCards = useMemo(() => {
    const swipeCardsData = feed.find(
      (el) => el._type === "playlist" && el.structure === "swipe-cards"
    );
    if (!swipeCardsData || swipeCardsData._type !== "playlist") return null;
    return <SwipeCards data={swipeCardsData.tracks} />;
  }, [feed]);

  const head = useMemo(() => {
    if (!profile) return null;
    return (
      <Header
        renderSwipeCards={renderSwipeCards}
        profile={profile}
        location={location}
        setLocation={setLocation}
        isReloading={isReloading}
      />
    );
  }, [profile, renderSwipeCards, location, isReloading]);

  const footer = useMemo(() => <Footer />, []);

  const renderItem = useCallback(
    ({ item, index }: { item: FeedItem; index: number }) => {
      return <ExploreSection data={item} index={index} isVisible={false} />;
    },
    []
  );

  const scrollY = useRef(0);
  const allowTopView = useRef(false);
  const [isTopViewVisible, setTopViewVisible] = useState(false);
  const onResponderRelease = useCallback(() => {
    allowTopView.current = false;
    setTopViewVisible(false);
  }, []);

  const onScrollBeginDrag = useCallback(() => {
    allowTopView.current = scrollY.current < 16;
  }, []);

  const topView = useMemo(() => {
    if (Platform.OS === "android") return null;
    if (!isTopViewVisible) return null;
    return <ZoTitle />;
  }, [isTopViewVisible]);

  const setFootVisible = useSetFootStore();
  const setFeedLoaded = useSetFeedLoaded();

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const H = event.nativeEvent.contentSize.height;
      const DH = device.WINDOW_HEIGHT;
      const y = event.nativeEvent.contentOffset.y;
      scrollY.current = y;
      const maxY = H - DH;
      const isBottom = y >= maxY - DH * 0.64;
      setFootVisible(isBottom);
      if (Platform.OS === "android") return;
      if (!allowTopView.current) {
        return;
      }
      setTopViewVisible(scrollY.current < -40);
    },
    []
  );

  const fetchMore = useCallback(() => {
    setFeedIndex((prev) => {
      const lastIndex = feedLength.current - 1;
      if (prev === lastIndex) return prev;
      return prev + LIMIT - 1;
    });
  }, []);

  const keyExtractor = useCallback((item: FeedItem, index: number) => {
    return item?.id ?? index;
  }, []);

  const liveFeed = useMemo(() => {
    return feed.slice(0, feedIndex + 1);
  }, [feedIndex, feed]);

  useEffect(() => {
    setFeedLoaded(liveFeed.length === feed.length);
  }, [liveFeed.length === feed.length]);

  const ref = useRef<ScrollView>(null);
  useScrollToTop(ref);
  useFCM();

  const list = useMemo(
    () => (
      <LegendList
        refScrollView={ref}
        data={liveFeed}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        recycleItems
        ListHeaderComponent={head}
        ListEmptyComponent={ListEmptyComponent}
        ListHeaderComponentStyle={styles.head}
        style={styles.fit}
        nestedScrollEnabled
        onScroll={onScroll}
        ListFooterComponent={footer}
        keyExtractor={keyExtractor}
        onEndReached={fetchMore}
        onEndReachedThreshold={0.3}
        overScrollMode={device.isAndroid ? "never" : "auto"}
        onResponderRelease={onResponderRelease}
        onScrollBeginDrag={onScrollBeginDrag}
      />
    ),
    [liveFeed, head]
  );

  return (
    <>
      {topView}
      {list}
    </>
  );
}

const MemoExplore = memo(Explore);

const styles = StyleSheet.create({
  fit: {
    flex: 1,
    width: "100%",
  },
  screen: {
    flex: 1,
    alignSelf: "stretch",
  },
  head: {
    zIndex: 11,
  },
  loader: {
    width: "100%",
    aspectRatio: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  zoTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  zoTitle: {
    fontFamily: "Kalam-Bold",
  },
});

const ZoTitle = memo(() => {
  useEffect(() => {
    triggerSelection();
  }, []);

  return (
    <Animated.View entering={FadeInUp} exiting={FadeOutUp} style={styles.zoTop}>
      <SafeAreaView safeArea="top" style={helpers.flexCenter}>
        <Text style={styles.zoTitle}>Zo Zo Zo ❤️</Text>
      </SafeAreaView>
    </Animated.View>
  );
});
