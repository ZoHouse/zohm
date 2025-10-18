import { Chip, Iconz, Pressable, Text } from "@/components/ui";
import StarRating from "@/components/ui/StarRating";
import { Review, StayBooking } from "@/definitions/booking";
import { SearchResult } from "@/definitions/general";
import useQuery from "@/hooks/useQuery";
import constants from "@/utils/constants";
import { logAxiosError } from "@/utils/network";
import { useIsFocused } from "@react-navigation/native";
import { router } from "expo-router";
import moment from "moment";
import React, { useCallback, useEffect, useMemo } from "react";
import { StyleSheet } from "react-native";

interface BookingRatingProps {
  booking: StayBooking;
  status: StayBooking["status"];
}

export default function BookingRating({ booking, status }: BookingRatingProps) {
  const isRatingEligible = useMemo(
    () =>
      constants.bookings.ratingEligibleStatus.includes(status) &&
      moment().isSameOrAfter(moment(booking.checkout)),
    [status, booking.checkout]
  );

  const {
    data: reviews,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<"ZO_BOOKINGS", SearchResult<Review>, Review>(
    "ZO_BOOKINGS",
    {
      select: (data) => data.data.results?.[0],
      enabled: isRatingEligible,
      throwOnError: (er) => {
        logAxiosError(er);
        return false;
      },
    },
    {
      path: [booking.code, "reviews"],
    }
  );

  const isFocused = useIsFocused();
  useEffect(() => {
    if (isFocused) {
      refetch();
    }
  }, [isFocused]);

  const onPress = useCallback(() => {
    if (reviews?.rating) {
      router.push(`/review/new?booking_code=${booking.code}&rating=${reviews.rating / 2}`);
    } else {
      router.push(`/review/new?booking_code=${booking.code}`);
    }
  }, [reviews?.rating, booking.code]);

  const handleRatingChange = useCallback((rating: number) => {}, []);

  if (!isRatingEligible) {
    return null;
  }

  return reviews?.rating ? (
    <Pressable activeOpacity={0.8} onPress={onPress} style={styles.container}>
      <Chip background="Inputbox" curve={100} style={styles.chip}>
        <Text type="Subtitle">You rated {reviews.rating / 2}</Text>
        <Iconz
          name="star"
          size={16}
          theme="Brand.Zostel"
          style={styles.alertIcon}
        />
        <Iconz name="rightAngle" size={16} fillTheme="Primary" />
      </Chip>
    </Pressable>
  ) : (
    <Pressable activeOpacity={0.8} style={styles.container} onPress={onPress}>
      <Chip background="Input" curve={100} style={styles.chip}>
        <Text type="Subtitle">How was the vibe?</Text>
        <StarRating
          rating={0}
          onChange={handleRatingChange}
          containerStyle={styles.starRating}
          disabled={isLoading || isFetching}
        />
      </Chip>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
  },
  alertIcon: {
    marginRight: 4,
    marginLeft: 4,
  },
  container: {
    marginBottom: 8,
  },
  starRating: {
    marginLeft: 4,
  },
});
