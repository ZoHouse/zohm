import { Chip, Iconz, Pressable, SmallButton, Text } from "@/components/ui";
import device from "@/config/Device";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import Ziew from "@/components/ui/View";
import Animated, {
  FadeInDown,
  interpolate,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import StarRating from "@/components/ui/StarRating";
import { router } from "expo-router";
import { WithDarkTheme } from "@/context/ThemeContext";
import useQuery from "@/hooks/useQuery";
import { logAxiosError } from "@/utils/network";
import constants from "@/utils/constants";
import moment from "moment";
import useProfile from "@/hooks/useProfile";
import { StayBooking } from "@/definitions/booking";
import { ActionsSheet } from "@/components/sheets";
import { getMapSheetOptions } from "@/utils/map";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useIsFocused } from "@react-navigation/native";

type BottomBarData = {
  id: string;
  title: string;
  subtitle?: string;
  titleOnPress?: () => void;
  topBar?: {
    text?: string;
    hasStars?: boolean;
    onPress?: (rating: number) => void;
  };
  primaryAction: {
    type: "button" | "star";
    emoji?: string;
    text?: string;
    onPress?: (rate?: number) => void;
  };
  secondaryAction?: {
    emoji?: string;
    onPress?: () => void;
  };
};

interface CardProps {
  index: number;
  scrollX: SharedValue<number>;
  data: BottomBarData;
}

const gap = 16;
const cardWidth = device.WINDOW_WIDTH - 48;

const Card = ({ index, scrollX, data }: CardProps) => {
  const hasContent = !!data.topBar;

  const inputRange = useMemo(
    () => [
      (index - 1) * (cardWidth + gap),
      index * (cardWidth + gap),
      (index + 1) * (cardWidth + gap),
    ],
    [index]
  );

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [0, -32, 0],
      "clamp"
    );
    return {
      transform: [{ translateY: translateY }],
    };
  });

  const animatedBorders = useAnimatedStyle(() => {
    const borderRadius = interpolate(
      scrollX.value,
      inputRange,
      [12, 0, 12],
      "clamp"
    );
    return {
      overflow: "hidden",
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
      borderTopLeftRadius: borderRadius,
      borderTopRightRadius: borderRadius,
    };
  });

  return (
    <View style={styles.bottomCard}>
      {hasContent ? <View style={styles.empty} /> : null}
      <View style={hasContent ? styles.cardWithTopContent : styles.card}>
        {hasContent ? (
          <Animated.View style={animatedStyle}>
            <Ziew background style={styles.topBar}>
              <Text type="Tertiary" color="Secondary">
                {data.topBar?.text}
              </Text>
              {data.topBar?.hasStars ? (
                <StarRating
                  rating={0}
                  starSize={16}
                  starStyle={styles.star}
                  onChange={data.topBar.onPress}
                  emptyColor="Icon.ViewOnly"
                />
              ) : null}
            </Ziew>
          </Animated.View>
        ) : null}
        <Animated.View style={animatedBorders}>
          <Ziew background="Secondary" style={styles.cardInfo}>
            <View style={styles.cardContent}>
              <Pressable
                activeOpacity={0.8}
                style={styles.cardContentTitle}
                onPress={data.titleOnPress}
              >
                <Text type="Subtitle" numberOfLines={1}>
                  {data.title}
                </Text>
                <Iconz name="rightAngle" size={8} fillTheme="Primary" />
              </Pressable>
              {data.subtitle ? (
                <Text type="Tertiary" color="Secondary" numberOfLines={1}>
                  {data.subtitle}
                </Text>
              ) : null}
            </View>
            {data.secondaryAction ? (
              <Pressable
                activeOpacity={0.8}
                onPress={data.secondaryAction.onPress}
              >
                <Chip background="Input" style={styles.infoChip} curve={100}>
                  <Text type="Subtitle">{data.secondaryAction.emoji}</Text>
                </Chip>
              </Pressable>
            ) : null}
            {data.primaryAction ? (
              data.primaryAction.type === "button" ? (
                <SmallButton
                  textStyle="SubtitleHighlight"
                  onPress={data.primaryAction.onPress}
                >
                  {`${String(data.primaryAction.emoji)} ${
                    data.primaryAction.text
                  }`.trim()}
                </SmallButton>
              ) : data.primaryAction.type === "star" ? (
                <StarRating
                  rating={0}
                  starSize={16}
                  starStyle={styles.star}
                  onChange={data.primaryAction.onPress}
                  emptyColor="Icon.ViewOnly"
                />
              ) : null
            ) : null}
          </Ziew>
        </Animated.View>
      </View>
    </View>
  );
};

const BottomBarHList = ({ list }: { list: BottomBarData[] }) => {
  const scrollX = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const keyExtractor = useCallback((item: BottomBarData) => item.id, []);

  const renderItem = useCallback(
    ({ item, index }: { item: BottomBarData; index: number }) => (
      <Card index={index} scrollX={scrollX} data={item} />
    ),
    []
  );

  return (
    <View style={styles.container}>
      <Animated.FlatList
        horizontal
        data={list}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={16 + device.WINDOW_WIDTH - 48}
        decelerationRate="fast"
        pagingEnabled
        onScroll={scrollHandler}
      />
    </View>
  );
};

const DarkHList = WithDarkTheme(memo(BottomBarHList));

const ExploreBottomBar = () => {
  const { zostelProfile } = useProfile();
  const { data: next, refetch } = useQuery("UPCOMING", {
    throwOnError: (er) => {
      logAxiosError(er);
      return false;
    },
    select: (data) => {
      if (data?.data) {
        return {
          upcoming: data.data.upcoming.filter((booking) =>
            constants.bookings.ratingEligibleStatus.includes(booking.status)
          ),
          active: data.data.active.filter((booking) =>
            constants.bookings.ratingEligibleStatus.includes(booking.status)
          ),
          pending: data.data.pending_review.filter((booking) =>
            constants.bookings.ratingEligibleStatus.includes(booking.status)
          ),
        };
      }
    },
  });

  const isFocused = useIsFocused();
  useEffect(() => {
    if (isFocused) {
      refetch();
    }
  }, [isFocused]);

  const isSelfCheckinDone = useCallback(
    (booking: StayBooking) =>
      Boolean(
        (booking.checkins ?? []).find((f) => f.user?.mobile === zostelProfile?.mobile)
      ),
    [zostelProfile]
  );

  const [mapCoords, setMapCoords] = useState<{
    latitude: number;
    longitude: number;
    name: string;
  } | null>(null);

  const clearMapCoords = useCallback(() => {
    setMapCoords(null);
  }, []);

  const toBookingPage = useCallback((bookingCode: string) => {
    router.push(`/booking/${bookingCode}`);
  }, []);

  const toCheckinPage = useCallback(
    (operatorCode: string, bookingCode: string) => {
      router.push(`/checkin/${operatorCode}?booking_code=${bookingCode}`);
    },
    []
  );

  const toReviewPage = useCallback(
    (bookingCode: string, rating: number = 0) => {
      router.push(`/review/new?booking_code=${bookingCode}&rate=${rating}`);
    },
    []
  );

  const toChat = useCallback((threadId?: string) => {
    if (!threadId) return;
    router.push(`/chat/${threadId}`);
  }, []);

  const bottomBarData = useMemo(() => {
    const data: BottomBarData[] = [];
    next?.upcoming.forEach((booking) => {
      const checkinDate = moment(booking.checkin);
      const checkinCompleted = isSelfCheckinDone(booking);
      const checkinEnabled = booking.operator.checkin_enabled;
      const daysDiff = checkinDate
        .startOf("day")
        .diff(moment().startOf("day"), "days");
      if (daysDiff < 0) return;
      const subtitle =
        daysDiff > 0
          ? `${daysDiff} day${daysDiff > 1 ? "s" : ""} to go!`
          : "Today's the day!";
      if (checkinEnabled && !checkinCompleted) {
        data.push({
          id: "not-checked-in-web",
          title: booking.operator.name,
          subtitle,
          titleOnPress: toBookingPage.bind(null, booking.code),
          primaryAction: {
            type: "button",
            emoji: "✍️",
            text: "Check-in",
            onPress: () => {
              toCheckinPage(booking.operator.code, booking.code);
            },
          },
          secondaryAction: {
            emoji: "📍",
            onPress: () => {
              setMapCoords({
                latitude: booking.operator.latitude,
                longitude: booking.operator.longitude,
                name: booking.operator.name,
              });
            },
          },
          topBar: {
            text: "⚡️ Check-in now to skip the queue when you arrive.",
          },
        });
      } else if (!checkinEnabled || (checkinEnabled && checkinCompleted)) {
        data.push({
          id: "not-checked-in-irl",
          title: booking.operator.name,
          subtitle,
          titleOnPress: toBookingPage.bind(null, booking.code),
          primaryAction: {
            type: "button",
            emoji: "📍",
            text: "Get Directions",
            onPress: () => {
              setMapCoords({
                latitude: booking.operator.latitude,
                longitude: booking.operator.longitude,
                name: booking.operator.name,
              });
            },
          },
        });
      }
    });

    next?.active.forEach((booking) => {
      const checkinDate = moment(booking.checkin);
      const checkoutDate = moment(booking.checkout);
      const checkinEnabled = booking.operator?.checkin_enabled;
      const checkinCompleted = isSelfCheckinDone(booking);
      const checkinApproved = booking.web_checkin_approved;
      if (!checkinEnabled || !checkinCompleted || !checkinApproved) {
        return;
      }
      if (booking.operator?.chat_thread_id) {
        data.push({
          id: "checked-in",
          title: booking.operator.name,
          subtitle: `${checkinDate.format("DD MMM")} → ${checkoutDate.format(
            "DD MMM"
          )}`,
          titleOnPress: toBookingPage.bind(null, booking.code),
          primaryAction: {
            type: "button",
            emoji: "💬",
            text: "Common Room",
            onPress: () => {
              toChat(booking.operator.chat_thread_id);
            },
          },
          topBar: {
            text: "How's the vibes?",
            hasStars: true,
            onPress: (rate) => toReviewPage(booking.code, rate ?? 5),
          },
          secondaryAction: {
            emoji: "📍",
            onPress: () => {
              setMapCoords({
                latitude: booking.operator.latitude,
                longitude: booking.operator.longitude,
                name: booking.operator.name,
              });
            },
          },
        });
      } else {
        data.push({
          id: "checked-sas-out",
          title: booking.operator.name,
          subtitle: `${checkinDate.format("DD MMM")} → ${checkoutDate.format(
            "DD MMM"
          )}`,
          titleOnPress: toBookingPage.bind(null, booking.code),
          primaryAction: {
            type: "star",
            onPress: (rate) => toReviewPage(booking.code, rate ?? 5),
          },
          topBar: {
            text: "How's the vibes?",
          },
          secondaryAction: {
            emoji: "📍",
            onPress: () => {
              setMapCoords({
                latitude: booking.operator.latitude,
                longitude: booking.operator.longitude,
                name: booking.operator.name,
              });
            },
          },
        });
      }
    });

    next?.pending.forEach((booking) => {
      const checkinDate = moment(booking.checkin);
      const checkoutDate = moment(booking.checkout);
      data.push({
        id: "checked-out",
        title: booking.operator?.name,
        subtitle: `${checkinDate.format("DD MMM")} → ${checkoutDate.format(
          "DD MMM"
        )}`,
        titleOnPress: toBookingPage.bind(null, booking.code),
        primaryAction: {
          type: "star",
          onPress: (rate) => toReviewPage(booking.code, rate ?? 5),
        },
        topBar: {
          text: "How was the vibes?",
        },
      });
    });

    return data;
  }, [next]);

  const mapSheet = useMemo(
    () =>
      mapCoords ? (
        <ActionsSheet
          isOpen
          items={getMapSheetOptions(mapCoords)}
          onDismiss={clearMapCoords}
        />
      ) : null,
    [mapCoords]
  );
  
  const bottom = useBottomTabBarHeight();
  const viewStyle = useMemo(() => [styles.safe, { bottom: bottom + 8 }], []);

  if (bottomBarData.length === 0) {
    return null;
  }


  return (
    <Animated.View entering={FadeInDown}>
      <View style={viewStyle}>
        <DarkHList list={bottomBarData} />
        {mapSheet}
      </View>
    </Animated.View>
  );
};

export default memo(ExploreBottomBar);

const styles = StyleSheet.create({
  safe: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
  },
  container: {},
  listContent: {
    paddingHorizontal: 24,
    gap: 16,
    alignItems: "flex-end",
  },
  card: {
    width: device.WINDOW_WIDTH - 48,
    borderRadius: 12,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  cardWithTopContent: {
    width: device.WINDOW_WIDTH - 48,
    borderRadius: 12,
    borderCurve: "continuous",
  },
  cardInfo: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderCurve: "continuous",
    width: "100%",
  },
  cardContent: {
    alignItems: "flex-start",
    flex: 1,
  },
  cardContentTitle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 4,
    width: "100%",
  },
  infoChip: {
    alignItems: "center",
    justifyContent: "center",
    height: 32,
    width: 32,
    paddingLeft: 1,
  },
  empty: {
    height: 32,
  },
  star: {
    marginRight: 4,
  },
  topBar: {
    height: 32,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingHorizontal: 12,
    borderCurve: "continuous",
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    overflow: "hidden",
  },
  bottomCard: {
    width: device.WINDOW_WIDTH - 48,
  },
});
