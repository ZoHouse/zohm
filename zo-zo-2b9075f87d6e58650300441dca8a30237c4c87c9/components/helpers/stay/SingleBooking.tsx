import { StyleSheet, View } from "react-native";
import moment from "moment";
import { useCallback, useMemo } from "react";
import { Iconz, Pressable, Text } from "@/components/ui";
import { toTitleCase } from "@/utils/data-types/string";
import useQuery from "@/hooks/useQuery";
import { logAxiosError } from "@/utils/network";
import { SearchResult } from "@/definitions/general";
import { Review } from "@/definitions/booking";
import StarRating from "@/components/ui/StarRating";
import constants from "@/utils/constants";

interface SingleBookingProps {
  code: string;
  status: keyof typeof BOOKING_STATUS_COLOR;
  checkout: string;
  checkin: string;
  name: string;
  onPress: (code: string) => void;
  isVisible: boolean;
  isReviewDisabled?: boolean;
  category: "zostel" | "zo" | "trips";
  hideStatus?: boolean;
}

const BOOKING_STATUS_COLOR = {
  pending: { color: "Secondary", text: "Pending" },
  confirmed: { color: "Primary", text: "Confirmed" },
  cancelled: { color: "Secondary", text: "Cancelled" },
  noshow: { color: "Secondary", text: "No Show" },
  checked_in: { color: "Primary", text: "Checked In" },
  checked_out: { color: "Primary", text: "Checked Out" },
  requested: { color: "Primary", text: "Requested" },
  paid: { color: "Primary", text: "Paid" },
} as const;

const SingleBooking = ({
  code,
  status,
  checkout,
  checkin,
  name,
  onPress,
  category,
  isVisible,
  isReviewDisabled,
  hideStatus = false,
}: SingleBookingProps) => {
  const enableReviews = useMemo(
    () =>
      isVisible &&
      !isReviewDisabled &&
      constants.bookings.ratingEligibleStatus.includes(status) &&
      moment().isSameOrAfter(moment(checkout)),
    [isVisible, isReviewDisabled, status, checkout]
  );

  const { data: reviews } = useQuery<
    "ZO_BOOKINGS",
    SearchResult<Review>,
    Review
  >(
    "ZO_BOOKINGS",
    {
      select: (data) => data.data.results?.[0],
      enabled: enableReviews,
      throwOnError: (er) => {
        logAxiosError(er);
        return false;
      },
    },
    {
      path: [code, "reviews"],
    }
  );

  const handleRatingChange = (rating: number) => {};
  const _onPress = useCallback(() => onPress(code), [code, onPress]);

  return (
    <Pressable activeOpacity={0.8} style={styles.row} onPress={_onPress}>
      {category === "trips" ? (
        <Iconz size={24} name="trips" fillTheme="Primary" style={styles.icon} />
      ) : (
        <Iconz size={24} name={category} noFill style={styles.icon} />
      )}
      <View style={styles.content}>
        <View style={styles.innerRow}>
          <Text style={styles.flex} numberOfLines={2}>
            {name}
          </Text>
          {!hideStatus && (
            <Text
              type="TextHighlight"
              color={BOOKING_STATUS_COLOR[status]?.color || "Secondary"}
            >
              {BOOKING_STATUS_COLOR[status]
                ? BOOKING_STATUS_COLOR[status].text
                : toTitleCase(status)}
            </Text>
          )}
        </View>
        <View style={styles.innerRow}>
          <Text type="Subtitle" color="Secondary">
            {moment(checkin).format("DD MMM")}
            {" → "}
            {moment(checkout).format("DD MMM")}
          </Text>
          {enableReviews && reviews?.rating && (
            <StarRating
              rating={Math.round(reviews?.rating / 2) || 0}
              onChange={handleRatingChange}
            />
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: "row", gap: 12, paddingVertical: 16 },
  innerRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },
  content: {
    gap: 4,
    flex: 1,
  },
  icon: { marginTop: 2 },
});

export default SingleBooking;
