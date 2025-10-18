import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import Clipboard from "@react-native-clipboard/clipboard";
import { router, useLocalSearchParams } from "expo-router";
import moment from "moment";
import {
  Confetti,
  DetailRow,
  Divider,
  GradientHeader,
  Iconz,
  Pressable,
  SafeAreaView,
  SectionTitle,
  Text,
  ThemeView,
  View as Ziew,
} from "@/components/ui";
import { StayPolicyLocationInfo } from "@/components/helpers/stay/";
import {
  StayCancellation,
  StayCancellationError,
} from "@/components/sheets/stay/";
import { useCurrency } from "@/context/CurrencyContext";
import { BookingCancellationError, StayBooking } from "@/definitions/booking";
import useQuery from "@/hooks/useQuery";
import useVisibilityState from "@/hooks/useVisibilityState";
import device from "@/config/Device";
import { logAxiosError } from "@/utils/network";
import { groupBy } from "@/utils/object";
import { showToast } from "@/utils/toast";
import {
  BookingShimmer,
  LocalMap,
  PendingPayment,
  RoomCard,
} from "@/components/helpers/stay-booking";
import { getBookingDetailPaymentInfo } from "@/utils/booking";
import helpers from "@/utils/styles/helpers";
import useProfile from "@/hooks/useProfile";
import CheckinSection from "@/components/helpers/checkin/CheckinSection";
import { useIsFocused } from "@react-navigation/native";
import BookingRating from "@/components/helpers/stay-booking/BookingRating";
import ZoImage from "@/components/ui/ZoImage";
import useDisableAndroidBack from "@/hooks/useDisableAndroidBack";

const statusEmojis = {
  checkin: "😁",
  checkout: "👋",
  confirmed: "🥳",
  pending: "⏳",
} as const;

const mapImageDimensions = {
  width: device.WINDOW_WIDTH - 48,
  height: (device.WINDOW_WIDTH - 48) / 0.75,
};

const BookingScreen = () => {
  const { pid, slug, code, id, from_payment } = useLocalSearchParams();
  const bookingId = (pid ?? slug ?? code ?? id) as string;

  const {
    data: booking,
    refetch,
    isLoading,
    isRefetching,
  } = useQuery(
    "STAY_BOOKING",
    {
      select: (data) => data.data,
      throwOnError: (er) => {
        logAxiosError(er);
        return false;
      },
    },
    {
      path: [bookingId],
    }
  );

  const [checkin, checkout] = useMemo(() => {
    return [moment(booking?.checkin), moment(booking?.checkout)];
  }, [booking]);

  const bookingStatus: StayBooking["status"] | undefined = useMemo(() => {
    if (booking) {
      if (
        checkout.isBefore(moment(), "day") &&
        booking.status === "confirmed"
      ) {
        return "checked_out";
      }
      return booking.status;
    }
  }, [booking]);

  return (
    <Ziew background style={styles.screen}>
      {booking && bookingStatus ? (
        <Animated.View
          style={helpers.stretch}
          entering={FadeInDown}
          key="booking-view"
        >
          <BookingView
            booking={booking}
            status={bookingStatus}
            checkin={checkin}
            checkout={checkout}
            refetch={refetch}
            fromPayment={from_payment === "true"}
            isReloading={isLoading || isRefetching}
          />
          {from_payment === "true" && <Confetti />}
        </Animated.View>
      ) : (
        <Animated.View
          style={helpers.stretch}
          entering={FadeInDown}
          key="booking-shimmer"
        >
          <SafeAreaView safeArea="top" style={styles.safe} />
          <BookingShimmer />
        </Animated.View>
      )}
    </Ziew>
  );
};

const BookingView = ({
  booking,
  status,
  checkin,
  checkout,
  refetch,
  fromPayment,
  isReloading,
}: {
  booking: StayBooking;
  status: StayBooking["status"];
  checkin: moment.Moment;
  checkout: moment.Moment;
  refetch: () => void;
  fromPayment: boolean;
  isReloading: boolean;
}) => {
  const { data: isValidCancellationPolicy } = useQuery(
    "STAY_OPERATORS",
    {
      select: (data) => {
        // @ts-ignore
        const policy = data.data.cancellation_policy;
        return !!(policy && Array.isArray(policy) && policy.length > 0);
      },
      throwOnError: (er) => {
        logAxiosError(er);
        return false;
      },
    },
    {
      path: [booking.operator.code, "cancellation-policy"],
    }
  );

  const [isCancellationOpen, showCancellation, hideCancellation] =
    useVisibilityState(false);

  const [cancellationError, setCancellationError] =
    useState<BookingCancellationError | null>(null);

  const isFocused = useIsFocused();
  useEffect(() => {
    if (isFocused) {
      refetch();
    }
  }, [isFocused]);

  const scrollRef = useRef<ScrollView>(null);

  const onCancellation = useCallback(() => {
    hideCancellation();
    refetch();
    setTimeout(() => {
      scrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
    }, 100);
  }, [refetch]);

  const totalNights = useMemo(() => {
    return checkout.diff(checkin, "days");
  }, [booking]);

  const title = useMemo(() => {
    return getBookingTitle(booking, status);
  }, [booking, status]);

  const copyBookingId = useCallback(() => {
    Clipboard.setString(booking.code);
    showToast({
      message: "Copied to clipboard",
      visibilityTime: 1000,
    });
  }, [booking.code]);

  const infoRows = useMemo(() => {
    return getBookingDetailInfo(
      booking,
      checkin,
      checkout,
      totalNights,
      copyBookingId
    );
  }, [booking, checkin, checkout, totalNights, copyBookingId]);

  const { formatCurrency } = useCurrency();

  const roomsInfo = useMemo(() => {
    const group = groupBy(booking.rooms, "id");
    return Object.keys(group).map((id) => {
      const room = group[+id][0];
      return {
        id,
        ...room.inventory,
        count: Math.floor(group[+id].length / totalNights),
        price: room.price,
        total_amount: room.total_amount,
        final_amount: room.final_amount,
      };
    });
  }, [booking.rooms]);

  const totalAmountDue = useMemo(
    () =>
      booking.total_amount_with_addons
        ? booking.total_amount_with_addons - booking.paid_amount
        : booking.total_amount - booking.paid_amount,
    [booking]
  );

  const { paymentList, paymentHighlightedList } = useMemo(() => {
    return getBookingDetailPaymentInfo(booking, formatCurrency, totalAmountDue);
  }, [formatCurrency, booking]);

  const pendingPayment = useMemo(() => {
    if (status === "pending") {
      const pendingPayment = booking.payments.find(
        (p) =>
          p.status === "In Progress" &&
          p.payment_mode === "PG via Payment Gateway" &&
          Boolean(p.amount)
      );
      return pendingPayment;
    }
  }, [booking, status]);

  const onBack = useCallback(() => {
    if (fromPayment) {
      router.dismissTo("/(tabs)/explore");
    } else {
      router.back();
    }
  }, []);

  const showWebCheckin = useMemo(
    () =>
      status === "confirmed" &&
      !!booking?.operator?.checkin_enabled &&
      moment().isBefore(moment(booking?.checkout), "day"),
    [booking, status]
  );

  const localMap = useMemo(
    () =>
      booking.operator.local_map.length ? (
        <LocalMap
          images={booking.operator.local_map}
          heading={`Experience ${booking.operator.destination.name}`}
        />
      ) : null,
    [booking.operator.local_map]
  );

  useDisableAndroidBack(fromPayment);

  const onShare = useCallback(() => {
    if (!booking) return;
    Share.share({
      message: `It's happening, I'm off to ${booking.operator.destination?.name}! Take a look at my booking at 🏡 ${booking.operator.name} for a super cool stay.\nhttps://www.zostel.com/booking/${booking.code}?utm_source=app-share&utm_medium=app-share`,
    }).catch((er) =>
      showToast({ message: "Something went wrong", type: "error" })
    );
  }, [booking.code]);

  const shareCheckin = useCallback(() => {
    Share.share({
      message: `Hey, I have booked your stay at ${booking?.operator?.name}. To skip the lines and get directly to the good part, complete your mandatory property check-in by filling this form.\n\nhttps://www.zostel.com/checkin/${booking?.operator.code}/${booking?.code}?utm_source=app-share&utm_medium=app-share`,
    }).catch((er) =>
      showToast({ message: "Something went wrong", type: "error" })
    );
  }, [booking]);

  const onCheckin = useCallback(() => {
    router.push(
      `/checkin/${booking.operator.code}?booking_code=${booking.code}`
    );
  }, [booking]);

  const { zostelProfile } = useProfile();

  const bookingsRefreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={isReloading}
        onRefresh={refetch}
        progressViewOffset={90}
      />
    ),
    [isReloading, refetch]
  );

  const toProperty = useCallback(() => {
    router.push(`/property/${booking.operator.code}`);
  }, [booking.operator.code]);

  return (
    <View style={styles.screen}>
      <GradientHeader y={0.4}>
        <View style={styles.headerContainer}>
          <Iconz
            name="arrow-left"
            size={24}
            fillTheme="Primary"
            onPress={onBack}
          />
          {status === "confirmed" ? (
            <ThemeView theme="Vibes.Green" style={styles.confirmedBadge}>
              <Text type="Tertiary" color="Button">
                Stay Confirmed
              </Text>
            </ThemeView>
          ) : null}
          <Iconz name="share" size={24} fillTheme="Primary" onPress={onShare} />
        </View>
      </GradientHeader>
      <ScrollView
        style={styles.screen}
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        refreshControl={bookingsRefreshControl}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerSpacer} />
        <SafeAreaView safeArea="top" />
        <View style={styles.contentContainer}>
          <Pressable
            activeOpacity={0.8}
            onPress={toProperty}
            style={styles.coverImageContainer}
          >
            <ZoImage
              url={booking.operator.images[0].image}
              width="m"
              id="stay-cover-image"
            />
          </Pressable>
          <SectionTitle noHorizontalPadding type="Title" children={title} />
          <BookingRating booking={booking} status={status} />
          {showWebCheckin && zostelProfile ? (
            <CheckinSection
              bookingData={booking}
              profile={zostelProfile}
              checkin={onCheckin}
              shareCheckin={shareCheckin}
            />
          ) : null}
          <View style={styles.infoRowsContainer}>
            {infoRows.map((row) => (
              <DetailRow gap={16} key={row.id} {...row} />
            ))}
          </View>
          <Divider marginTop={16} />
          <SectionTitle noHorizontalPadding children="Rooms Info" />
          <View style={styles.roomsContainer}>
            {roomsInfo.map((room) => (
              <RoomCard room={room} key={room.id} totalNights={totalNights} />
            ))}
          </View>
          <Divider marginTop={16} />
          {localMap}
          <SectionTitle noHorizontalPadding children="Payment Info" />
          <View style={styles.paymentContainer}>
            {paymentList.map((py) => (
              <View key={py.label} style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>{py.label}</Text>
                <Text type={py.boldR ? "TextHighlight" : undefined}>
                  {py.value}
                </Text>
              </View>
            ))}
            <Ziew background="Input" style={styles.paymentHighlightedContainer}>
              {paymentHighlightedList.map((py) => (
                <View key={py.label} style={styles.paymentRow}>
                  <Text
                    type={py.bold ? "TextHighlight" : undefined}
                    style={styles.paymentLabel}
                  >
                    {py.label}
                  </Text>
                  <Text
                    type={py.bold || py.boldR ? "TextHighlight" : undefined}
                  >
                    {py.value}
                  </Text>
                </View>
              ))}
            </Ziew>
          </View>
          <Divider marginTop={16} marginBottom={8} />
          <StayPolicyLocationInfo
            operator={booking.operator}
            checkin={checkin.format("YYYY-MM-DD")}
          />
          {status === "confirmed" &&
          checkin.isAfter(moment(), "date") &&
          isValidCancellationPolicy ? (
            <>
              <Divider marginTop={8} marginBottom={8} />
              <View>
                <Text>
                  Change of Plans?{" "}
                  <Text
                    type="TextHighlight"
                    onPress={showCancellation}
                    style={styles.cancelLink}
                  >
                    Cancel your booking
                  </Text>
                </Text>
              </View>
            </>
          ) : null}
        </View>
        <SafeAreaView safeArea="bottom" />
        {pendingPayment ? <View style={styles.pendingPaymentSpacer} /> : null}
      </ScrollView>
      {pendingPayment ? (
        <PendingPayment
          payment={pendingPayment}
          refetch={refetch}
          formatCurrency={formatCurrency}
        />
      ) : null}
      {isCancellationOpen && (
        <StayCancellation
          isOpen={isCancellationOpen}
          bookingCode={booking.code}
          onClose={hideCancellation}
          onSubmit={onCancellation}
          total_amount={totalAmountDue}
          paid_amount={booking.paid_amount}
          setCancellationError={setCancellationError}
        />
      )}
      {cancellationError && (
        <StayCancellationError
          isOpen={!!cancellationError}
          onClose={setCancellationError.bind(null, null)}
          error={cancellationError}
        />
      )}
    </View>
  );
};

export default BookingScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 24,
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
    height: 56,
  },
  confirmedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderCurve: "continuous",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headerSpacer: {
    height: 56,
  },
  contentContainer: {
    paddingTop: 8,
    gap: 8,
  },
  coverImageContainer: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 16,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  infoRowsContainer: {
    gap: 8,
  },
  roomsContainer: {
    gap: 16,
  },
  paymentContainer: {
    gap: 8,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  paymentLabel: {
    flex: 1,
  },
  paymentHighlightedContainer: {
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginHorizontal: -12,
    borderCurve: "continuous",
  },
  cancelLink: {
    textDecorationLine: "underline",
  },
  pendingPaymentSpacer: {
    height: 72,
  },
  bookingCodeContainer: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
  },
  bookingCodeText: {
    flex: 1,
  },
  roomItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  roomContent: {
    flex: 1,
    gap: 4,
  },
  roomInner: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    justifyContent: "space-between",
  },
  roomImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  roomPriceContainer: {
    alignItems: "flex-end",
  },
  mapImageContainer: {
    borderRadius: 12,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  mapListContainer: {
    height: mapImageDimensions.height,
    marginHorizontal: -24,
  },
  mapListContent: {
    gap: 8,
    paddingHorizontal: 24,
  },
  safe: {
    marginTop: 8,
    marginBottom: 42,
  },
});

const getBookingDetailInfo = (
  booking: StayBooking,
  checkin: moment.Moment,
  checkout: moment.Moment,
  totalNights: number,
  copyBookingId: () => void
) => {
  const info = [];

  info.push({
    id: "booking-code",
    emoji: "🎟️",
    value: (
      <View style={styles.bookingCodeContainer}>
        <Text style={styles.bookingCodeText}>
          Booking ID:{" "}
          <Text onPress={copyBookingId} type="TextHighlight">
            {booking.code}
          </Text>
        </Text>
        <Iconz
          name="copy"
          fillTheme="Primary"
          size={20}
          onPress={copyBookingId}
        />
      </View>
    ),
  });

  info.push({
    id: "dates",
    emoji: "🗓️",
    value: (
      <Text style={helpers.flex}>
        Check-in on{" "}
        <Text type="TextHighlight">{checkin.format("DD MMM'YY")}</Text> →
        Check-out on{" "}
        <Text type="TextHighlight">{checkout.format("DD MMM'YY")}</Text> (
        {totalNights} {totalNights > 1 ? "nights" : "night"})
      </Text>
    ),
  });

  if (booking.guests.length > 0) {
    info.push({
      id: "guests",
      emoji: "👥",
      value: (
        <Text>
          <Text type="TextHighlight">{booking.guests.length}</Text> Guest
          {booking.guests.length > 1 ? "s" : ""}
        </Text>
      ),
    });
  }

  return info;
};

const getBookingTitle = (
  booking: StayBooking,
  status: StayBooking["status"]
) => {
  const stay = booking.operator.name;
  if (status === "cancelled") {
    return `Your stay at ${stay} is cancelled`;
  }
  if (status === "checked_out") {
    return `You checked-out from ${stay} ${statusEmojis.checkout}`;
  }
  if (status === "checked_in") {
    return `You checked-in at ${stay} ${statusEmojis.checkin}`;
  }
  if (status === "noshow") {
    return `You didn't show up at ${stay}`;
  }
  if (status === "confirmed") {
    return `Zo Zo Zo! Your stay at ${stay} is confirmed ${statusEmojis.confirmed}`;
  }
  return `Zo Zo Zo! Your stay at ${stay} is ${status}`;
};
