import TripFilterHead from "@/components/helpers/trip/TripFilterHead";
import TripSpotlight from "@/components/helpers/trip/TripSpotlight";
import TripTabHead from "@/components/helpers/trip/TripTabHead";
import { Loader, SmallButton } from "@/components/ui";
import Text from "@/components/ui/Text";
import View from "@/components/ui/View";
import device from "@/config/Device";
import { useThemeColors } from "@/context/ThemeContext";
import { BookingSeed } from "@/definitions/booking";
import { FilterValue, TripInventory } from "@/definitions/trip";
import useQuery from "@/hooks/useQuery";
import useVisibilityState from "@/hooks/useVisibilityState";
import { groupListByCondition } from "@/utils/data-types/list";
import { triggerFeedBack } from "@/utils/haptics";
import helpers from "@/utils/styles/helpers";
import { Image } from "expo-image";
import moment from "moment";
import React, {
  Dispatch,
  memo,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  SectionList,
  SectionListData,
  StyleSheet,
} from "react-native";
import { useSharedValue, withTiming } from "react-native-reanimated";
import Ziew from "@/components/ui/View";
import TripRow from "@/components/helpers/trip/TripRow";
import { TripShimmer } from "@/components/helpers/trip/TripShimmers";
import { useFetchTrips } from "@/utils/trips";
import TripFilterSheet from "@/components/sheets/trips/Filter";
import TripSortSheet from "@/components/sheets/trips/Sort";
import { useScrollToTop } from "@react-navigation/native";

const TripListScreen: React.FC = () => {
  const [atTop, setAtTop] = useState(true);
  const isBlack = useSharedValue(1);

  useEffect(() => {
    isBlack.value = withTiming(atTop ? 1 : 0);
    triggerFeedBack();
  }, [atTop]);

  const { onEndReached, trips, hasNextPage } = useFetchTrips();
  const isNoMore = !hasNextPage;

  return (
    <Ziew background style={styles.container}>
      <TripTabHead isBlack={isBlack} />
      <TripList
        setAtTop={setAtTop}
        allTrips={trips ?? []}
        onEndReached={onEndReached}
        isNoMore={isNoMore}
      />
    </Ziew>
  );
};

const TripList = ({
  setAtTop,
  allTrips,
  onEndReached,
  isNoMore,
}: {
  setAtTop: (value: boolean) => void;
  allTrips: TripInventory[];
  onEndReached?: () => void;
  isNoMore: boolean;
}) => {
  const [isFilterSheetOpen, showFilterSheet, hideFilterSheet] =
    useVisibilityState(false);
  const [isSortSheetOpen, showSortSheet, hideSortSheet] =
    useVisibilityState(false);

  const { data: tags } = useQuery("BOOKINGS_SEED", {
    select: (data) => ({
      allTags: tagsToFilter(data.data.trip_category_tags ?? []),
      headTags: tagsToFilter(data.data.trip_filter_tags ?? []),
    }),
  });

  const [selectedTags, setSelectedTags] = useState<FilterValue[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<FilterValue[]>([]);
  const [from, setFrom] = useState<FilterValue[]>([]);
  const [minPrice, setMinPrice] = useState<{
    value: number;
    position: number;
  } | null>(null);
  const [maxPrice, setMaxPrice] = useState<{
    value: number;
    position: number;
  } | null>(null);
  const [sortBy, setSortBy] = useState<FilterValue | null>(null);
  const queryString = useMemo(() => {
    const months = selectedMonth.map((m) => m.code).join();
    const froms = from.map((f) => f.code).join();

    const [geoTags, themeTags] = groupListByCondition(selectedTags, (t) =>
      ["domestic", "india", "international"].includes(t.code)
    );

    const isInternational =
      geoTags.find((t) => t.code === "international") !== undefined;
    const isDomestic =
      geoTags.find((t) => t.code === "domestic" || t.code === "india") !==
      undefined;

    const queries = [];

    if (isInternational && isDomestic) {
    } else if (isInternational) {
      queries.push(`international=true`);
    } else if (isDomestic) {
      queries.push(`international=false`);
    }
    if (months) {
      queries.push(`months=${months}`);
    }
    if (froms) {
      queries.push(`destinations=${froms}`);
    }
    if (minPrice) {
      const price = minPrice.value * 1000;
      queries.push(`min_price=${price * 10 ** 8}`);
    }
    if (maxPrice) {
      const price = maxPrice.value * 1000;
      queries.push(`max_price=${price * 10 ** 8}`);
    }
    if (sortBy) {
      queries.push(`ordering=${sortBy.code}`);
    }
    if (themeTags.length) {
      queries.push(`tags=${themeTags.map((t) => t.code).join(",")}`);
    }

    const queryString = queries.join("&");

    return queryString;
  }, [selectedMonth, from, minPrice, maxPrice, sortBy, selectedTags]);
  const [isQueryFetcherLoaded, setQueryFetcherLoaded] = useState(false);
  const [response, setResponse] = useState<InfiniteFetcherResponse | null>(
    null
  );
  const tripList: SectionListData<TripInventory | "shimmer" | "empty">[] =
    useMemo(() => {
      const trip = response?.trips;
      if (!!queryString && isQueryFetcherLoaded) {
        const isLoading = response?.isLoading;
        return [
          {
            data: isLoading
              ? ["shimmer"]
              : Number(response?.trips?.length) > 0
              ? (trip as TripInventory[])
              : ["empty", ...(allTrips as TripInventory[])],
          },
        ];
      }
      return [
        {
          data: allTrips.length ? allTrips : ["shimmer"],
        },
      ];
    }, [allTrips, queryString, response, isQueryFetcherLoaded]);

  const showLocalData = Boolean(
    queryString && !(tripList?.[0]?.data?.[0] === "empty")
  );
  const isNoMoreLocal = !response?.hasNextPage;
  const onEndReachedCB = showLocalData ? response?.onEndReached : onEndReached;

  const keyExtractor = useCallback(
    (item: TripInventory | "shimmer" | "empty", index: number) => {
      if (item === "shimmer") {
        return `shimmer-${index}`;
      }
      if (item === "empty") {
        return `empty-${index}`;
      }
      return item.slug;
    },
    []
  );

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      setAtTop(event.nativeEvent.contentOffset.y < 560);
    },
    []
  );

  const clearAllFilters = useCallback(() => {
    setSelectedTags([]);
    setSelectedMonth([]);
    setFrom([]);
    setMinPrice(null);
    setMaxPrice(null);
  }, []);

  const scrollViewRef = React.useRef<SectionList>(null);
  const initLoad = useRef(false);

  const scrollToSection = useCallback(
    () =>
      setTimeout(() => {
        scrollViewRef.current?.scrollToLocation({
          sectionIndex: 0,
          itemIndex: 1,
        });
      }, 100),
    []
  );

  useEffect(() => {
    if (!initLoad.current) {
      initLoad.current = true;
    } else {
      scrollToSection();
    }
  }, [queryString]);

  const renderSectionHeader = useCallback(
    () => (
      <TripFilterHead
        monthFilters={monthFilters}
        setSelectedMonth={setSelectedMonth}
        selectedMonth={selectedMonth}
        selectedSort={sortBy}
        tags={tags?.headTags ?? []}
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
        openSortSheet={showSortSheet}
        showFilterSheet={showFilterSheet}
      />
    ),
    [selectedMonth, sortBy, tags?.headTags, selectedTags]
  );

  const head = useMemo(
    () => (
      <View>
        <View style={styles.head}>
          <View style={styles.headInfo}>
            <Image
              style={styles.tripLogo}
              source={require("@/assets/vectors/icons/zotrip.svg")}
            />
            <Text type="Title" style={styles.blackHead} center>
              Invaluable trips for most valuable prices
            </Text>
          </View>
          <TripSpotlight />
        </View>
        <Wave />
      </View>
    ),
    []
  );

  const footer = useMemo(() => {
    const hideFooter = showLocalData ? isNoMoreLocal : isNoMore;
    return hideFooter ? (
      <></>
    ) : (
      <View style={helpers.center}>
        <Loader />
      </View>
    );
  }, [showLocalData, isNoMore, isNoMoreLocal]);

  const renderItem = useCallback(
    ({ item }: { item: TripInventory | "shimmer" | "empty" }) => {
      if (item === "shimmer") {
        return (
          <View style={styles.shimmerBox}>
            <TripShimmer />
          </View>
        );
      }
      if (item === "empty") {
        return <EmptyState onClear={clearAllFilters} />;
      }
      return <TripRow trip={item} />;
    },
    []
  );

  const [primary] = useThemeColors(["Background.Primary"]);
  const listStyle = useMemo(
    () => [styles.list, { backgroundColor: primary }],
    [primary]
  );

  useScrollToTop(scrollViewRef);

  return (
    <>
      <SectionList
        ref={scrollViewRef}
        ListHeaderComponent={head}
        onScroll={onScroll}
        sections={tripList}
        keyExtractor={keyExtractor}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderItem}
        initialNumToRender={2}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReachedCB}
        contentContainerStyle={listStyle}
        onScrollToIndexFailed={scrollToSection}
        ListFooterComponent={footer}
      />
      {queryString && (
        <InfiniteFetcher
          key={`q=${queryString}`}
          queryString={queryString}
          setLoading={setQueryFetcherLoaded}
          setResponse={setResponse}
        />
      )}
      {isFilterSheetOpen && (
        <TripFilterSheet
          mainTags={tags?.headTags ?? []}
          allTags={tags?.allTags ?? []}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          from={from}
          setFrom={setFrom}
          minPrice={minPrice}
          setMinPrice={setMinPrice}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          isOpen={isFilterSheetOpen}
          onClose={hideFilterSheet}
        />
      )}
      {isSortSheetOpen && (
        <TripSortSheet
          values={sortValues}
          selectedValue={sortBy}
          onSelect={setSortBy}
          isOpen={isSortSheetOpen}
          onClose={hideSortSheet}
        />
      )}
    </>
  );
};

export default TripListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blackContainer: {
    backgroundColor: "black",
    width: "100%",
  },
  list: {
    paddingBottom: 96,
    // backgroundColor: Colors.Background.Primary,
  },
  wave: {
    height: 4,
    // backgroundColor: Colors.Background.Primary,
  },
  waveBox: {
    transform: [{ translateY: -10 }],
  },
  headInfo: {
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingBottom: 36,
  },
  head: { paddingTop: 24, backgroundColor: "black" },
  blackHead: { color: "#F2F2F2" },
  shimmerBox: { height: device.WINDOW_HEIGHT * 0.64 },
  tripLogo: { width: 126, height: 18 },
  emptyView: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 48,
    gap: 24,
  },
});

const getCurrentAndNextNMonths = (n: number) => {
  const currentMonth = moment().month();
  const months: { name: string; code: string }[] = [];
  for (let i = 0; i < n; i++) {
    const d = moment().month(currentMonth + i);
    const name = d.format("MMMM");
    const code = d.format("M");
    months.push({ name, code });
  }
  return months;
};

const monthFilters: FilterValue[] = getCurrentAndNextNMonths(3);

const sortValues = [
  {
    name: "Departure - Early to Late",
    code: "date",
  },
  {
    name: "Departure - Late to early",
    code: "-date",
  },
  {
    name: "Prices - Low to High",
    code: "price",
  },
  {
    name: "Prices - High to Low",
    code: "-price",
  },
];

const tagsToFilter = (tags: BookingSeed["trip_category_tags"]) =>
  tags?.map((tag) => ({
    name: `${tag.emoji ?? ""} ${tag.title ?? ""}`.trim(),
    code: tag.tag,
  })) ?? [];

type InfiniteFetcherResponse = {
  trips?: TripInventory[];
  isLoading?: boolean;
  hasNextPage?: boolean;
  onEndReached?: () => void;
};

const InfiniteFetcher = memo(
  ({
    queryString,
    setResponse,
    setLoading,
  }: {
    queryString: string;
    setResponse: Dispatch<SetStateAction<InfiniteFetcherResponse | null>>;
    setLoading: Dispatch<SetStateAction<boolean>>;
  }) => {
    const data = useFetchTrips({ limit: 4, query: queryString, path: "find" });

    useEffect(() => {
      setResponse(data);
    }, [data]);

    useEffect(() => {
      setLoading(true);
      return () => {
        setLoading(false);
      };
    }, []);

    return null;
  }
);

const EmptyState = memo(({ onClear }: { onClear: () => void }) => (
  <View style={styles.emptyView}>
    <Text center>
      Oops! There are no trips matching your criteria, but here are other trips
      you might like.
    </Text>
    <SmallButton onPress={onClear}>Clear All Filters</SmallButton>
  </View>
));

const Wave = memo(() => {
  const [primary] = useThemeColors(["Background.Primary"]);

  return (
    <Ziew background>
      <View style={styles.waveBox}>
        <Image
          style={{ width: 704, height: 26 }}
          tintColor={primary}
          source={require("@/assets/vectors/icons/wave.svg")}
        />
        <View style={[styles.wave, { backgroundColor: primary }]} />
      </View>
    </Ziew>
  );
});
