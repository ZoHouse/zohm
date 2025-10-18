import React, { memo, useCallback, useMemo, useState } from "react";
import {
  View as Ziew,
  Text,
  NoContent,
  Divider,
  SafeAreaView,
  Iconz,
  Loader,
  Chip,
  Pressable,
} from "@/components/ui";
import {
  RefreshControl,
  SectionList,
  SectionListRenderItem,
  StyleSheet,
  View,
  ViewToken,
} from "react-native";
import helpers from "@/utils/styles/helpers";
import { router } from "expo-router";
import { GeneralObject } from "@/definitions/general";
import moment from "moment";
import useInifiteQuery from "@/hooks/useInifiteQuery";
import { StayBooking } from "@/definitions/booking";
import {
  BookingListShimmer,
  CardBookingItem,
  SingleBooking,
} from "@/components/helpers/stay";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
} from "react-native-reanimated";
import { useReactiveRef } from "@/utils/hooks";
import { TripBookingInfo } from "@/definitions/trip";

const BOOKING_STATUS_COLOR = {
  pending: { color: "Secondary", text: "Pending" },
  confirmed: { color: "Primary", text: "Confirmed" },
  cancelled: { color: "Secondary", text: "Cancelled" },
  noshow: { color: "Secondary", text: "No Show" },
  checked_in: { color: "Primary", text: "Checked In" },
  checked_out: { color: "Primary", text: "Checked Out" },
  requested: { color: "Primary", text: "Requested" },
} as const;

const isCardViewFromStatus = (status: keyof typeof BOOKING_STATUS_COLOR) => {
  return ["confirmed", "checked_in", "requested"].includes(status);
};

const ListEmpty = memo(() => (
  <View style={helpers.fitCenter}>
    <NoContent
      source={require("@/assets/lottie/no-bookings.json")}
      title="It's time to fill this space with exciting travels!"
      btnProps={{
        title: "Book Now",
        onPress: () => router.dismissTo("/(tabs)/explore"),
      }}
    />
  </View>
));

const ListTripEmpty = memo(() => (
  <View style={helpers.fitCenter}>
    <NoContent
      source={require("@/assets/lottie/no-bookings.json")}
      title="It's time to fill this space with exciting trips!"
      btnProps={{
        title: "Book Now",
        onPress: () => router.dismissTo("/(tabs)/trips"),
      }}
    />
  </View>
));

const tabs = ["Zostel", "Zo Trips"] as const;

const viewabilityConfig = {
  itemVisiblePercentThreshold: 50,
  minimumViewTime: 300,
};

const BookingListScreen: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<(typeof tabs)[number]>(
    tabs[0]
  );

  const [onPressZostel, onPressTrips] = useMemo(
    () => [() => setSelectedTab(tabs[0]), () => setSelectedTab(tabs[1])],
    []
  );

  const {
    data: bookings,
    hasNextPage: hasMoreBookings,
    onEndReached: onEndReachedBookings,
    isLoading,
    isRefetching,
    refetch,
  } = useInifiteQuery<StayBooking>({
    key: "BOOKINGS_LIST",
  });

  const {
    data: trips,
    hasNextPage: hasMoreTrips,
    onEndReached: onEndReachedTrips,
    isLoading: isLoadingTrips,
    isRefetching: isRefetchingTrips,
    refetch: refetchTrips,
  } = useInifiteQuery<TripBookingInfo>({
    key: "TRIP_BOOKINGS",
  });

  const [visibleBookings, setVisibleBookings] = useState<
    Record<string, boolean>
  >({});
  const visibleBookingsRef = useReactiveRef(visibleBookings);

  const bookingsRefreshControl = useMemo(
    () => <RefreshControl refreshing={isRefetching} onRefresh={refetch} />,
    [isRefetching, refetch]
  );

  const tripsRefreshControl = useMemo(
    () => (
      <RefreshControl refreshing={isRefetchingTrips} onRefresh={refetchTrips} />
    ),
    [isRefetchingTrips, refetchTrips]
  );

  const bookingSections = useMemo(
    () => getSortedGroupedBookings(bookings),
    [bookings]
  );

  const tripSections = useMemo(() => getSortedGroupedBookings(trips), [trips]);

  const renderHeader = useCallback(
    (data: { section: { title: string } }) => (
      <Ziew background style={styles.pv}>
        <Text type="SectionTitle">{data.section.title}</Text>
      </Ziew>
    ),
    []
  );

  const onPressBooking = useCallback((code: string) => {
    router.push(`/booking/${code}`);
  }, []);

  const onPressTripBooking = useCallback((code: string) => {
    router.push(`/trip/booking/${code}`);
  }, []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const map: Record<string, boolean> = {};
      viewableItems.forEach(({ key }) => {
        if (visibleBookingsRef.current[key]) return;
        if (key) {
          map[key] = true;
        }
      });
      if (Object.keys(map).length) {
        setVisibleBookings((prev) => ({
          ...prev,
          ...map,
        }));
      }
    },
    []
  );

  const renderBooking: SectionListRenderItem<
    StayBooking,
    {
      title: string;
      data: StayBooking[];
    }
  > = useCallback(
    ({ item: booking }) => {
      const isPast = moment(booking.checkout).isBefore(moment(), "day");
      const isCardView = isCardViewFromStatus(booking.status);
      const status =
        isPast && ["confirmed", "checked_in"].includes(booking.status)
          ? "checked_out"
          : booking.status;

      if (!isPast && isCardView) {
        const handlePress = () => onPressBooking(booking.code);
        return (
          <CardBookingItem
            imageUrl={booking.operator.cover_image ?? ""}
            name={booking.operator.name}
            startDate={booking.checkin}
            endDate={booking.checkout}
            status={status}
            onPress={handlePress}
          />
        );
      }
      return (
        <SingleBooking
          code={booking.code}
          status={status}
          checkout={booking.checkout}
          checkin={booking.checkin}
          name={booking.operator.name}
          onPress={onPressBooking}
          isVisible={visibleBookings[booking.code]}
          category={"zostel"}
          isReviewDisabled={false}
        />
      );
    },
    [visibleBookings]
  );

  const renderTripBooking: SectionListRenderItem<
    TripBookingInfo,
    {
      title: string;
      data: TripBookingInfo[];
    }
  > = useCallback(({ item }) => {
    const booking = item.booked_skus?.[0].sku;
    const name = booking.inventory?.name;
    const isPast = moment(item.end_at).isBefore(moment(), "day");
    const status =
      isPast && ["confirmed", "checked_in"].includes(item.status)
        ? "confirmed"
        : item.status;

    return (
      <SingleBooking
        code={item.pid}
        status={status === "requested" ? "paid" : status}
        checkout={item.end_at}
        checkin={item.start_at}
        name={name}
        onPress={onPressTripBooking}
        isVisible={false}
        category="trips"
        isReviewDisabled={true}
      />
    );
  }, []);

  const bookingsFooter = useMemo(
    () =>
      hasMoreBookings ? (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          key="foot-load"
          style={styles.footer}
        >
          <Loader />
        </Animated.View>
      ) : null,
    [hasMoreBookings]
  );

  const tripsFooter = useMemo(
    () =>
      hasMoreTrips ? (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          key="foot-load"
          style={styles.footer}
        >
          <Loader />
        </Animated.View>
      ) : null,
    [hasMoreTrips]
  );

  const keyExtractor = useCallback((item: StayBooking) => item.code, []);
  const tripsKeyExtractor = useCallback(
    (item: TripBookingInfo) => item.pid,
    []
  );

  const bookingSectionList = useMemo(
    () => (
      <SectionList
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        sections={bookingSections}
        renderItem={renderBooking}
        stickySectionHeadersEnabled
        ListFooterComponent={bookingsFooter}
        renderSectionHeader={renderHeader}
        ListEmptyComponent={ListEmpty}
        ItemSeparatorComponent={Separator}
        onEndReached={onEndReachedBookings}
        keyExtractor={keyExtractor}
        initialNumToRender={10}
        refreshControl={bookingsRefreshControl}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
    ),
    [
      bookingSections,
      onEndReachedBookings,
      bookingsFooter,
      bookingsRefreshControl,
      renderBooking,
    ]
  );

  const tripsSectionList = useMemo(
    () => (
      <SectionList
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        sections={tripSections}
        renderItem={renderTripBooking}
        stickySectionHeadersEnabled
        ListFooterComponent={tripsFooter}
        renderSectionHeader={renderHeader}
        ListEmptyComponent={ListTripEmpty}
        ItemSeparatorComponent={Separator}
        onEndReached={onEndReachedTrips}
        keyExtractor={tripsKeyExtractor}
        initialNumToRender={10}
        refreshControl={tripsRefreshControl}
      />
    ),
    [
      tripSections,
      onEndReachedTrips,
      tripsFooter,
      tripsRefreshControl,
      renderTripBooking,
    ]
  );

  const zostelBookings = useMemo(() => {
    if (isLoading) {
      return (
        <Animated.View
          key="zostel-bookings-loader"
          entering={FadeInDown}
          style={styles.flex}
          exiting={FadeOutDown}
        >
          <BookingListShimmer />
        </Animated.View>
      );
    } else {
      return (
        <Animated.View
          key="zostel-bookings"
          entering={FadeInDown}
          style={styles.flex}
          exiting={FadeOutDown}
        >
          {bookingSectionList}
        </Animated.View>
      );
    }
  }, [isLoading, bookingSectionList]);

  const tripBookings = useMemo(() => {
    if (isLoadingTrips) {
      return (
        <Animated.View
          key="trips-bookings-loader"
          entering={FadeInDown}
          style={styles.flex}
          exiting={FadeOutDown}
        >
          <BookingListShimmer />
        </Animated.View>
      );
    } else {
      return (
        <Animated.View
          key="trips-bookings"
          entering={FadeInDown}
          style={styles.flex}
          exiting={FadeOutDown}
        >
          {tripsSectionList}
        </Animated.View>
      );
    }
  }, [isLoadingTrips, tripsSectionList]);

  return (
    <Ziew background style={helpers.stretch}>
      <SafeAreaView safeArea="top" />
      <View style={styles.header}>
        <Iconz
          name="arrow-left"
          onPress={router.back}
          size={24}
          fillTheme="Primary"
        />
        <Text type="Title">All Bookings</Text>
      </View>
      <View style={styles.tabs}>
        <Pressable onPress={onPressZostel} activeOpacity={0.8}>
          <Chip
            curve={100}
            stroke={selectedTab === tabs[0] ? "Selected" : "NonSelected"}
            style={styles.chip}
          >
            <Text type="TextHighlight">{tabs[0]}</Text>
          </Chip>
        </Pressable>
        <Pressable onPress={onPressTrips} activeOpacity={0.8}>
          <Chip
            curve={100}
            stroke={selectedTab === tabs[1] ? "Selected" : "NonSelected"}
            style={styles.chip}
          >
            <Text type="TextHighlight">{tabs[1]}</Text>
          </Chip>
        </Pressable>
      </View>
      {selectedTab === tabs[0] ? zostelBookings : tripBookings}
    </Ziew>
  );
};

export default BookingListScreen;

const Separator = () => <Divider paddingLeft={24} />;

const getSortedGroupedBookings = <T extends GeneralObject>(
  data: T[] | undefined,
  key = "start_at"
) => {
  if (!data) return [];

  const dateGroupedData: Array<{ title: string; data: T[] }> = [];
  const currentYear = moment().year();

  data.forEach((booking: T) => {
    const startDate = booking.checkin || booking[key];
    const bookingYear = moment(startDate).year();
    const title =
      bookingYear === currentYear
        ? moment(startDate).format("MMM YYYY") // e.g., "Jan 2024"
        : String(bookingYear); // e.g., "2023"

    const existingGroup = dateGroupedData.find((item) => item.title === title);

    if (existingGroup) {
      existingGroup.data.push(booking);
    } else {
      dateGroupedData.push({ title, data: [booking] });
    }
  });

  return dateGroupedData.sort((a, b) => {
    const dateA = moment(a.title, "MMM YYYY").isValid()
      ? moment(a.title, "MMM YYYY")
      : moment(a.title, "YYYY");
    const dateB = moment(b.title, "MMM YYYY").isValid()
      ? moment(b.title, "MMM YYYY")
      : moment(b.title, "YYYY");

    return dateB.diff(dateA);
  });
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 72,
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  ph: {
    paddingHorizontal: 24,
  },
  pv: {
    paddingVertical: 12,
  },
  footer: {
    ...helpers.center,
    paddingVertical: 24,
  },
  flex: { flex: 1 },
  row: { flexDirection: "row", gap: 12, paddingVertical: 16 },
  innerRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "space-between",
  },
  gap: {
    gap: 4,
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
    paddingLeft: 24,
    paddingVertical: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tripItem: {
    aspectRatio: 312 / 260,
    borderRadius: 16,
    borderCurve: "continuous",
    overflow: "hidden",
    marginVertical: 8,
  },
  tripList: { paddingBottom: 72, flexGrow: 1, gap: 8 },
  header: {
    marginTop: 8,
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 16,
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
});
