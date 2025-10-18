import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import Chip from "@/components/ui/Chip";
import Divider from "@/components/ui/Divider";
import Iconz from "@/components/ui/Iconz";
import Loader from "@/components/ui/Loader";
import SmallButton from "@/components/ui/SmallButton";
import Text from "@/components/ui/Text";
import { useCurrency } from "@/context/CurrencyContext";
import Counter from "@/components/helpers/stay/Counter";
import Calendar from "@/components/helpers/stay/Calendar";
import { Operator, Room } from "@/definitions/discover";
import { FeedAvailabilityItem, FeedPricingItem } from "@/definitions/booking";
import RoomCardCarousel from "@/components/helpers/stay/RoomCarousel";
import useVisibilityState from "@/hooks/useVisibilityState";
import RoomInfoSheet from "@/components/sheets/stay/RoomInfo";
import Pressable from "@/components/ui/Pressable";
import AnimatedArrow from "@/components/ui/AnimatedArrow";
import Logger from "@/utils/logger";

interface RoomCardProps {
  isLoading: boolean;
  room: Room;
  availability?: FeedAvailabilityItem;
  pricing?: FeedPricingItem;
  operatorCode: string;
  count: number;
  setCount: (roomId: string, count: number) => void;
  toGallery: (roomId?: string) => void;
  operator: Operator;
}

const RoomCard = ({
  isLoading,
  room,
  availability,
  pricing,
  operatorCode,
  count,
  setCount,
  toGallery,
  operator,
}: RoomCardProps) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const toggleCalendar = () => {
    setIsCalendarOpen(!isCalendarOpen);
  };

  const [isInfoOpen, showInfo, hideInfo] = useVisibilityState(false);

  const { formatCurrency } = useCurrency();

  const price = useMemo(
    () => pricing?.offered_price ?? pricing?.price ?? 0,
    [pricing]
  );

  const { isBookable, maxUnits } = useMemo(() => {
    return {
      isBookable: availability
        ? !(!availability.available && !!availability.units)
        : false,
      maxUnits: availability?.units,
    };
  }, [availability]);

  const isAvailable = maxUnits && maxUnits > 0;

  const setRoomCount = useCallback(
    (count: number, action: "I" | "D") => {
      setCount(String(room.id), count);
      Logger.addRoom(count, room.name, operator.code, operator.name, action);
    },
    [setCount, room, operator]
  );

  const handleRoomSelect = useCallback(() => {
    setRoomCount(1, "I");
  }, [setRoomCount]);

  const onGalleryPress = useCallback(() => {
    hideInfo();
    toGallery(String(room.id));
  }, [room.id]);

  return (
    <Animated.View layout={LinearTransition}>
      <Chip curve={16} stroke="Primary" style={styles.chipContainer}>
        <View style={styles.imageContainer}>
          <RoomCardCarousel
            images={room.images}
            w="m"
            onPress={onGalleryPress}
          />
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <Text>{room.name}</Text>
            </View>
            {isBookable && isAvailable ? (
              <View style={styles.priceContainer}>
                <Text type="TextHighlight" style={styles.price}>
                  {formatCurrency(price, 0)}
                  {!pricing?.discount ? (
                    <Text type="Tertiary" color="Secondary">
                      /night
                    </Text>
                  ) : null}
                </Text>
                {pricing?.discount ? (
                  <Text type="Tertiary" color="Secondary" style={styles.price}>
                    <Text
                      type="Tertiary"
                      color="Secondary"
                      style={styles.underline}
                    >
                      {formatCurrency(pricing.base_price || pricing.price, 0)}
                    </Text>
                    /night
                  </Text>
                ) : null}
                {pricing?.discount ? (
                  <Text
                    type="MiniFocus"
                    color="Success"
                    style={styles.newOfferText}
                  >
                    OFFER APPLIED
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
          <View style={styles.actionRow}>
            <Pressable onPress={toggleCalendar}>
              <Chip
                background="Secondary"
                style={styles.calendarChip}
                curve={100}
              >
                <Text type="Subtitle">🗓️</Text>
                <AnimatedArrow isDown={isCalendarOpen} />
              </Chip>
            </Pressable>
            <Pressable onPress={showInfo}>
              <Chip background="Secondary" style={styles.infoChip} curve={100}>
                <Iconz name="info" fillTheme="Primary" size={16} />
              </Chip>
            </Pressable>
            <View style={styles.spacer}></View>
            {isLoading ? (
              <Animated.View key="loader" entering={FadeIn} exiting={FadeOut}>
                <Loader height={40} width={40} />
              </Animated.View>
            ) : !pricing ? null : isBookable ? (
              isAvailable ? (
                count ? (
                  <Animated.View
                    key="counter"
                    entering={FadeIn}
                    exiting={FadeOut}
                  >
                    <Counter
                      count={count}
                      setCount={setRoomCount}
                      max={maxUnits}
                      min={0}
                    />
                  </Animated.View>
                ) : (
                  <Animated.View
                    key="button"
                    entering={FadeIn}
                    exiting={FadeOut}
                  >
                    <SmallButton onPress={handleRoomSelect}>
                      {room.sub_category === "dorm-bed"
                        ? " Select Bed"
                        : room.sub_category === "private-room"
                        ? " Select Room"
                        : "Select Unit"}
                    </SmallButton>
                  </Animated.View>
                )
              ) : (
                <Animated.View
                  key="sold-out-button"
                  entering={FadeIn}
                  exiting={FadeOut}
                >
                  <SmallButton disabled>Sold Out</SmallButton>
                </Animated.View>
              )
            ) : (
              <Animated.View
                key="unavailable-button"
                entering={FadeIn}
                exiting={FadeOut}
              >
                <SmallButton disabled>Unavailable</SmallButton>
              </Animated.View>
            )}
          </View>
        </View>
        {isCalendarOpen && (
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            key="availability-calendar"
          >
            <Divider />
            <View style={styles.calendarContainer}>
              <Calendar inventoryId={room.id} operatorCode={operatorCode} />
            </View>
          </Animated.View>
        )}
      </Chip>
      {isInfoOpen && (
        <RoomInfoSheet
          isOpen={isInfoOpen}
          onClose={hideInfo}
          operator={room}
          onGalleryPress={onGalleryPress}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  chipContainer: {
    overflow: "hidden",
  },
  imageContainer: {
    aspectRatio: 312 / 156,
    backgroundColor: "lightgray",
  },
  contentContainer: {
    padding: 16,
  },
  headerRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  titleContainer: {
    flex: 1,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  badgeText: {
    position: "absolute",
    right: 0,
    top: -10,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 12,
  },
  calendarChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    height: 32,
    paddingHorizontal: 12,
  },
  infoChip: {
    alignItems: "center",
    justifyContent: "center",
    height: 32,
    width: 32,
  },
  spacer: {
    flex: 1,
  },
  calendarContainer: {
    marginVertical: 16,
  },
  newOfferText: {
    position: "absolute",
    top: -11,
    right: 0,
    width: 100,
    textAlign: "right",
  },
  underline: {
    textDecorationLine: "line-through",
  },
  price: Platform.select({
    android: {
      minWidth: 100,
      alignSelf: "flex-end",
      textAlign: "right",
    },
    default: {},
  }),
});

export default RoomCard;
