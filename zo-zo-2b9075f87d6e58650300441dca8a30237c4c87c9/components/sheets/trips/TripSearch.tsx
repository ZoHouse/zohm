import {
  Iconz,
  Loader,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
} from "@/components/ui";
import Sheet from "../Base";
import { StyleSheet, View } from "react-native";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import constants from "@/utils/constants";
import { getCurrenciedPrice, useFetchTrips } from "@/utils/trips";
import { isValidString } from "@/utils/data-types/string";
import { TripInventory } from "@/definitions/trip";
import { router } from "expo-router";
import helpers from "@/utils/styles/helpers";
import moment from "moment";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { LegendList } from "@legendapp/list";
import useInifiteQuery from "@/hooks/useInifiteQuery";
import ZoImage from "@/components/ui/ZoImage";

interface TripSearchSheetProps {
  isOpen: boolean;
  close: () => void;
}

const TripSearchSheet = ({ isOpen, close }: TripSearchSheetProps) => {
  const [search, setSearch] = useState<string>("");
  const [isWatchingText, setWatchingText] = useState<boolean>(false);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  const { trips: allTrips, onEndReached: onEndReachedAllTrips } = useFetchTrips(
    { limit: 16 }
  );

  const {
    data: tripResults,
    isLoading,
    onEndReached,
  } = useInifiteQuery<TripInventory>({
    key: "TRIP",
    enabled: !isWatchingText && isValidString(search),
    limit: 10,
    query: `search=${search.trim()}`,
  });

  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);
    if (isValidString(text)) {
      setWatchingText(true);
    }
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    typingTimeout.current = setTimeout(async () => {
      setWatchingText(false);
    }, 1000);
  }, []);

  const onTripPress = useCallback((trip: TripInventory) => {
    close();
    router.push(`/trip/${trip.pid}`);
  }, []);

  const loading = useMemo(
    () => (
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        key="loader"
        style={helpers.center}
      >
        <Loader />
      </Animated.View>
    ),
    []
  );

  const renderItem = useCallback(({ item }: { item: TripInventory }) => {
    const onPress = () => onTripPress(item);
    const batchText = item.batches?.[0]
      ? moment(item.batches[0], "YYYY-MM-DD").format("MMMM")
      : undefined;
    const priceText = item.starting_price
      ? getCurrenciedPrice(item.starting_price, item.currency, 1, 0)
      : "Sold Out";
    return (
      <Pressable onPress={onPress} activeOpacity={0.8} style={styles.item}>
        <View style={styles.searchImage}>
          <ZoImage url={item.media?.[0]?.url} width={100} key={item.pid} />
        </View>
        <View style={styles.flex}>
          <Text type="Subtitle">{item.name}</Text>
          {batchText && (
            <Text type="Tertiary" color="Secondary">
              {batchText}
            </Text>
          )}
          <Text type="Tertiary" color="Secondary">
            {priceText}
          </Text>
        </View>
      </Pressable>
    );
  }, []);

  const keyExtractor = useCallback(
    (item: TripInventory, index: number) => `${item.pid}-${index}`,
    []
  );

  const notFound = useMemo(
    () =>
      allTrips?.length ? (
        <>
          <Animated.View
            style={styles.flexStretch}
            entering={FadeIn}
            key={"not-found"}
            exiting={FadeOut}
          >
            <LegendList
              ListHeaderComponent={EmptyView}
              contentContainerStyle={styles.list}
              data={allTrips}
              estimatedItemSize={72}
              recycleItems
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              keyExtractor={keyExtractor}
              onEndReached={onEndReachedAllTrips}
            />
          </Animated.View>
        </>
      ) : (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
          <EmptyView />
        </Animated.View>
      ),
    [allTrips]
  );

  const dataList = useMemo(
    () => (
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        style={styles.flexStretch}
      >
        <LegendList
          contentContainerStyle={styles.list}
          data={tripResults ?? []}
          recycleItems
          renderItem={renderItem}
          estimatedItemSize={72}
          onEndReached={onEndReached}
          showsVerticalScrollIndicator={false}
          keyExtractor={keyExtractor}
        />
      </Animated.View>
    ),
    [tripResults, onEndReached]
  );

  const allTripsList = useMemo(
    () =>
      allTrips?.length ? (
        <Animated.View
          style={styles.flexStretch}
          entering={FadeIn}
          exiting={FadeOut}
        >
          <LegendList
            contentContainerStyle={styles.list}
            data={allTrips}
            renderItem={renderItem}
            recycleItems
            showsVerticalScrollIndicator={false}
            estimatedItemSize={72}
            keyExtractor={keyExtractor}
            onEndReached={onEndReachedAllTrips}
          />
        </Animated.View>
      ) : (
        loading
      ),
    [allTrips]
  );

  return (
    <Sheet isOpen={isOpen} onDismiss={close} fullScreen hideHandle disableContentDragForAndroid>
      <SafeAreaView safeArea="top" style={styles.flex}>
        <View style={styles.searchHeader}>
          <Iconz onPress={close} name="cross" size={24} fillTheme="Primary" />
        </View>
        <View style={styles.searchInput}>
          <TextInput
            value={undefined}
            onChangeText={handleSearchChange}
            placeholder="Search"
            autoFocus
            inSheet
          />
        </View>
        {isLoading || isWatchingText
          ? loading
          : search.trim().length > 0
          ? tripResults && tripResults.length > 0
            ? dataList
            : notFound
          : allTripsList}
      </SafeAreaView>
    </Sheet>
  );
};

export default memo(TripSearchSheet);

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  flexStretch: { flex: 1, alignSelf: "stretch" },
  searchInput: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    paddingBottom: 16,
  },
  searchImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  searchText: { alignItems: "center", marginTop: 16, marginHorizontal: 24 },
  searchResult: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 24,
  },
  searchResultHead: {
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  datePicker: {
    borderRadius: 16,
    borderCurve: "continuous",
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  flexCenter: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
    gap: 4,
    justifyContent: "center",
  },
  searchHeader: {
    flexDirection: "row",
    paddingHorizontal: 24,
    height: 56,
    justifyContent: "space-between",
    alignItems: "center",
  },
  emptyWidth: { width: 24 },
  pr: { paddingRight: 16 },
  list: { flexGrow: 1, paddingBottom: 64, gap: 12 },
  item: {
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 12,
  },
  empty: {
    gap: 24,
    padding: 40,
    alignItems: "center",
  },
  emptyImage: { width: 64, height: 64 },
});

const EmptyView = memo(() => (
  <View style={styles.empty}>
    <View style={styles.emptyImage}>
      <ZoImage url={constants.assetURLS.tripSearchError} width={null} />
    </View>
    <Text center>
      Oops! We don't have this trip yet, but you can explore similar experiences
      below.
    </Text>
  </View>
));
