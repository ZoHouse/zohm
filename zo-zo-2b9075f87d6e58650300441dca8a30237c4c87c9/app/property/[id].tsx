import { LayoutChangeEvent, Share, StyleSheet, View } from "react-native";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { router, useLocalSearchParams, useRouter } from "expo-router";
import useQuery from "@/hooks/useQuery";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { Destination, Operator } from "@/definitions/discover";
import { showAdultAndKidsWarning } from "@/utils/booking";
import {
  Booking,
  FeedAvailabilityItem,
  FeedPricingItem,
  CouponResponse,
} from "@/definitions/booking";
import { useBooking } from "@/context/BookingContext";
import useMutation from "@/hooks/useMutation";
import { logAxiosError } from "@/utils/network";
import useVisibilityState from "@/hooks/useVisibilityState";
import { CurrencySheet } from "@/components/sheets/";
import { useCurrency } from "@/context/CurrencyContext";
import { useReactiveRef } from "@/utils/hooks";
import { StayPolicyLocationInfo } from "@/components/helpers/stay/";
import { MaxOccupancy } from "@/components/sheets/stay/";
import {
  GradientHeader,
  Text,
  SafeAreaView,
  Chip,
  Iconz,
  Pressable,
  Divider,
  SectionTitle,
  View as Ziew,
} from "@/components/ui";
import {
  AdultWarningChip,
  Amenities,
  KnowBeforeYouGo,
  Rooms,
  StayShimmer,
  CurvedCarousel,
  BookBar,
} from "@/components/helpers/stay";
import helpers from "@/utils/styles/helpers";
import { LegendList } from "@legendapp/list";
import MapCardView from "@/components/helpers/map/MapCard";
import constants from "@/utils/constants";
import { getURLType } from "@/utils/search";
import { useNearStay } from "@/hooks/stay/useNearStay";
import { MapOperator } from "@/definitions/zo";

const StayScreen = () => {
  const { pid, id } = useLocalSearchParams();
  const _id = pid ?? id;

  const { data: operator } = useQuery(
    "STAY_OPERATORS",
    {
      enabled: Boolean(_id),
      select: (data) => data.data?.operator,
    },
    {
      path: [`${_id ?? ""}`],
    }
  );

  return (
    <Ziew background style={helpers.stretch}>
      {operator ? (
        <Animated.View style={styles.screen} entering={FadeInDown} key="stay">
          <Stay operator={operator} />
        </Animated.View>
      ) : (
        <Animated.View
          style={helpers.stretch}
          key="shimmer"
          exiting={FadeOutDown}
        >
          <SafeAreaView safeArea="top" style={styles.safeArea} />
          <StayShimmer />
        </Animated.View>
      )}
    </Ziew>
  );
};

const Stay = ({ operator }: { operator: Operator }) => {
  const { show, age } = showAdultAndKidsWarning(operator);

  const {
    availabilityMap,
    priceMap,
    isLoading,
    minPrice,
    cart,
    setCount,
    isLoadingApplyCoupon,
    couponResponse,
    onNext,
    startDate,
    endDate,
    isMaxOccupancySheetOpen,
    hideMaxOccupancySheet,
  } = useStayBooking(operator);

  const [isCurrencySheetOpen, showCurrencySheet, hideCurrencySheet] =
    useVisibilityState(false);
  const { selectedCurrency } = useCurrency();

  const [propertyTags, showSection, maxOccupancy] = useMemo(() => {
    const propertyTags = operator.tags.filter((t) =>
      t.categories?.includes("property_page")
    );

    const showSection =
      propertyTags.length ||
      operator.type_code === "H" ||
      operator.type_code === "P" ||
      show;

    const maxOccupancy =
      operator.type_code === "H" || operator.type_code === "P"
        ? operator.bookable_occupancy
        : undefined;

    return [propertyTags, showSection, maxOccupancy];
  }, [operator]);

  const roomSectionY = useRef(300);
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    roomSectionY.current = e.nativeEvent.layout.y;
  }, []);

  const scrollToRoomSection = useCallback(() => {
    scrollViewRef.current?.scrollTo({
      y: roomSectionY.current,
      animated: true,
    });
  }, []);

  const toGallery = useCallback((roomId?: string) => {
      router.navigate({
        pathname: "/gallery",
        params: { type: "stay", code: operator.code, room_id: roomId },
      });
    }, [operator.code]);

  const onViewAllPress = useCallback(() => {
    toGallery();
  }, [toGallery]);

  const onShare = useCallback(() => {
    const type = getURLType(operator.type_code, operator.operating_model);
    Share.share({
      message: `Hey, I found this amazing ${
        type === "zostel-homes" ? "homestay" : "hostel"
      } in ${operator.destination.name}.😍\nCheck out ${
        operator.name
      } here.\nhttps://www.zostel.com/zostel/${operator.destination.slug}/${
        operator.slug
      }/?utm_source=app-share&utm_medium=app-share`,
    });
  }, [operator]);

  const nearOperators = useNearStay(operator.destination.code, operator.code);

  return (
    <Ziew background style={styles.screen}>
      <GradientHeader y={0}>
        <View style={styles.nav}>
          <Iconz
            name="arrow-left"
            onPress={router.back}
            fillTheme="Primary"
            size={24}
          />
          <Iconz name="share" fillTheme="Primary" size={24} onPress={onShare} />
        </View>
      </GradientHeader>
      <Animated.ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView safeArea="top" style={styles.container}>
          <View style={styles.headerContainer}>
            <View style={styles.header} />
            <Text center type="Title" style={styles.title}>
              {operator.name}
            </Text>
            <View style={styles.carousel}>
              <CurvedCarousel list={operator.images} />
            </View>
            <View style={styles.galleryButton}>
              <Pressable activeOpacity={0.8} onPress={onViewAllPress}>
                <Chip curve={100} stroke="Primary" style={styles.seeAll}>
                  <Text type="SubtitleHighlight">🏞️ See all photos</Text>
                  <Iconz name="arrow-right" size={16} />
                </Chip>
              </Pressable>
            </View>
            {show && (
              <View style={styles.adult}>
                <AdultWarningChip age={age} />
              </View>
            )}
          </View>
          <View style={styles.about}>
            <Text type="Title">About</Text>
            <Text>{operator.short_description}</Text>
          </View>
          {showSection ? (
            <>
              <Divider marginBottom={16} marginTop={16} />
              <View style={styles.gap}>
                <Text type="SectionTitle">Know Before You Go</Text>
                <KnowBeforeYouGo
                  show={show}
                  age={age}
                  items={propertyTags}
                  max={maxOccupancy}
                />
              </View>
            </>
          ) : null}
          <View onLayout={onLayout} />
          <Divider marginBottom={16} marginTop={24} />
          <View style={styles.gap}>
            <View style={styles.roomRow}>
              <Text type="SectionTitle">Select Your Room</Text>
              <Pressable onPress={showCurrencySheet} style={styles.currency}>
                <Text>
                  {selectedCurrency.symbol ? selectedCurrency.symbol + " " : ""}
                  {selectedCurrency.id}
                </Text>
                <Iconz name="downAngle" fillTheme="ViewOnly" size={16} />
              </Pressable>
            </View>
            <Rooms
              operator={operator}
              availability={availabilityMap}
              pricing={priceMap}
              isLoading={isLoading}
              cart={cart}
              setCount={setCount}
              toGallery={toGallery}
            />
          </View>
          <Divider marginBottom={16} marginTop={16} />
          <View style={styles.gap}>
            <Text type="SectionTitle">What Zo Offers</Text>
            <Amenities amenities={operator.amenities} />
          </View>
          <Divider marginTop={16} marginBottom={8} />
          <StayPolicyLocationInfo
            operator={operator}
            checkin={startDate.format("YYYY-MM-DD")}
          />
          <ExploreArea
            nearOperators={nearOperators}
            destinationName={operator.destination.name}
          />
        </SafeAreaView>
      </Animated.ScrollView>
      {operator && (
        <BookBar
          scrollToRooms={scrollToRoomSection}
          operator={operator}
          isLoadingApplyCoupon={isLoadingApplyCoupon}
          isLoadingPricing={isLoading}
          couponResponse={couponResponse}
          minPrice={minPrice}
          onNext={onNext}
        />
      )}
      {isCurrencySheetOpen && (
        <CurrencySheet
          isOpen={isCurrencySheetOpen}
          onClose={hideCurrencySheet}
        />
      )}
      {isMaxOccupancySheetOpen && (
        <MaxOccupancy
          isOpen={isMaxOccupancySheetOpen}
          onClose={hideMaxOccupancySheet}
          max={operator.bookable_occupancy}
          name={operator.name}
          checkin={startDate}
          checkout={endDate}
          groupBookingAllowed={operator.data?.group_booking_allowed}
          destinationName={operator.destination.name}
          nearOperators={nearOperators}
        />
      )}
    </Ziew>
  );
};

export default StayScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignSelf: "stretch",
  },
  safeArea: {
    marginTop: 24,
    marginBottom: 42,
  },
  title: {
    fontFamily: "Kalam-Bold",
    fontSize: 32,
    lineHeight: 44,
    marginBottom: 24,
  },
  carousel: {
    height: 324,
    marginHorizontal: -24,
  },
  gap: {
    gap: 24,
  },
  currency: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  roomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  about: { gap: 24, paddingBottom: 8 },
  adult: {
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 8,
  },
  seeAll: {
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  galleryButton: {
    marginVertical: 32,
    marginBottom: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    height: 56,
  },
  headerContainer: {
    paddingBottom: 8,
  },
  container: { gap: 8, paddingBottom: 120 },
  nav: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  list: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  hList: {
    marginHorizontal: -24,
    height: constants.map.cardHeight,
    marginTop: 16,
  },
  hListContent: {
    paddingHorizontal: 24,
    gap: constants.map.cardSpacing,
  },
});

const useStayBooking = (operator: Operator) => {
  const { startDate, endDate, duration } = useBooking();

  const roomIds = useMemo(() => {
    return operator.rooms.map((room) => room.id).join(",");
  }, [operator.rooms]);

  const { data: offeredRooms, isLoading } = useQuery(
    "STAY_OFFERED_ROOMS",
    {
      enabled: !!operator.code,
      select: (data) => data.data,
    },
    {
      search: {
        room_ids: roomIds,
        property_code: operator.code,
        checkin: startDate.format("YYYY-MM-DD"),
        checkout: endDate.format("YYYY-MM-DD"),
      },
    }
  );

  const [
    isMaxOccupancySheetOpen,
    showMaxOccupancySheet,
    hideMaxOccupancySheet,
  ] = useVisibilityState(false);

  const { minPrice, priceMap, availabilityMap } = useMemo(() => {
    const priceMap: Record<string, FeedPricingItem | undefined> = {};
    const availabilityMap: Record<string, FeedAvailabilityItem | undefined> =
      {};
    let minPrice = 0;

    if (!offeredRooms?.rooms?.length) {
      return {
        minPrice,
        priceMap,
        availabilityMap,
      };
    }

    minPrice = offeredRooms.rooms[0].price.per_night;
    offeredRooms.rooms.forEach((room) => {
      const roomPrice: FeedPricingItem = {
        offered_price: room.price.final / duration,
        base_price: room.price.base_price / duration,
        price: room.price.per_night,
        discount: room.price.discount / duration,
        has_offer: room.has_offer,
      };
      priceMap[room.id] = roomPrice;
      availabilityMap[room.id] = room.availability;
      minPrice = Math.min(minPrice, roomPrice.offered_price);
    });

    return {
      minPrice,
      priceMap,
      availabilityMap,
    };
  }, [offeredRooms?.rooms]);

  const { mutateAsync: applyCoupon, isPending: isLoadingApplyCoupon } =
    useMutation("STAY_BOOKINGS_APPLY_COUPON", {});
  const [couponResponse, setCouponResponse] = useState<CouponResponse>();

  const bookingDetails = useRef<Booking | undefined>(undefined);

  // will have to do manual post, need cancellation,
  const hitCoupon: (
    rooms: Booking["rooms"]
  ) => Promise<CouponResponse | undefined> = useCallback(
    (rooms: Booking["rooms"]) => {
      const data = {
        checkin: startDate.format("YYYY-MM-DD"),
        checkout: endDate.format("YYYY-MM-DD"),
        property_code: operator.code,
        rooms,
      };
      bookingDetails.current = data;
      return applyCoupon(data).then((res) => res.data?.booking);
    },
    [startDate, endDate]
  );

  const [cart, setCart] = useState<Record<string, number>>({});

  const checkAndHitApplyCoupon = useCallback(
    (newCart: Record<string, number>) => {
      let hasRooms = false;
      const rooms = Object.entries(newCart)
        .map(([id, count]) => {
          if (count > 0) {
            hasRooms = true;
          }
          return {
            id: +id,
            count,
          };
        })
        .filter((r) => r.count > 0) as Booking["rooms"];
      rooms.forEach((r) => {
        const offeredRoom = offeredRooms?.rooms.find((or) => or.id === r.id);
        if (offeredRoom) {
          r._ref = offeredRoom.ref_id;
          if (offeredRoom.has_offer && offeredRoom.offer?.id) {
            r.offer_id = offeredRoom.offer.id;
          }
        }
      });
      if (hasRooms && rooms.length) {
        hitCoupon(rooms)
          .then((res) => {
            if (res) {
              setCouponResponse(res);
            }
          })
          .catch((er) => {
            logAxiosError(er);
            setCouponResponse(undefined);
          });
      } else {
        setCouponResponse(undefined);
      }
    },
    [hitCoupon, offeredRooms?.rooms.length]
  );

  const updateCart = useCallback(
    (newCart: Record<string, number>) => {
      setCart(newCart);
      checkAndHitApplyCoupon(newCart);
    },
    [checkAndHitApplyCoupon]
  );

  const setCount = useCallback(
    (roomId: string, count: number) => {
      const newCart = { ...cart, [roomId]: count };
      const totalCount = Object.values(newCart).reduce(
        (acc, curr) => acc + curr,
        0
      );
      if (
        ["H", "P"].includes(operator.type_code) &&
        totalCount > operator.bookable_occupancy
      ) {
        showMaxOccupancySheet();
        return;
      } else {
        hideMaxOccupancySheet();
      }
      updateCart(newCart);
    },
    [cart, updateCart, operator.bookable_occupancy, operator.type_code]
  );

  const cartRef = useReactiveRef(cart);
  const updateCartRef = useReactiveRef(updateCart);

  useEffect(() => {
    const newCart: typeof cartRef.current = {};
    Object.entries(cartRef.current).forEach(([id, count]) => {
      if (!count) {
        return;
      }
      if (!availabilityMap[id]?.available) {
        newCart[id] = 0;
        updateCartRef.current(newCart);
      } else {
        newCart[id] = Math.min(count, availabilityMap[id].units);
        updateCartRef.current(newCart);
      }
    });
  }, [availabilityMap]);

  const router = useRouter();

  const onNext = useCallback(() => {
    if (bookingDetails.current) {
      const params = {
        checkin: bookingDetails.current.checkin,
        checkout: bookingDetails.current.checkout,
        property_code: bookingDetails.current.property_code,
        rooms: bookingDetails.current.rooms
          .map((r) => [r.id, r._ref, r.count, r.offer_id].join(","))
          .join("|"),
      };
      router.navigate({
        pathname: "/stay-confirm",
        params,
      });
    }
  }, []);

  return {
    priceMap,
    availabilityMap,
    isLoading,
    isLoadingApplyCoupon,
    minPrice,
    cart,
    startDate,
    endDate,
    setCount,
    couponResponse,
    onNext,
    isMaxOccupancySheetOpen,
    hideMaxOccupancySheet,
  };
};

interface ExploreAreaProps {
  nearOperators: MapOperator[];
  destinationName: string;
}

const ExploreArea = memo(({ nearOperators, destinationName }: ExploreAreaProps) => {
    if (!nearOperators.length) {
      return null;
    }

    return (
      <View>
        <Divider marginBottom={8} />
        <SectionTitle
          noHorizontalPadding
          children={`Explore ${destinationName}`}
        />
        <LegendList
          horizontal
          data={nearOperators}
          renderItem={({ item }) => <MapCardView operator={item} />}
          keyExtractor={(item) => item.code}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hListContent}
          style={styles.hList}
        />
      </View>
    );
  });
