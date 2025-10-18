import {
  Button,
  Chip,
  Divider,
  Iconz,
  SmallButton,
  Text,
} from "@/components/ui";
import { StayBooking } from "@/definitions/booking";
import { ZostelProfile } from "@/definitions/profile";
import { getCheckinInfo } from "@/utils/checkin";
import { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";

const CheckinSection = ({
  bookingData,
  profile,
  checkin,
  shareCheckin,
}: {
  bookingData: StayBooking;
  profile: ZostelProfile;
  checkin: () => void;
  shareCheckin: () => void;
}) => {
  const { isSelfCheckInDone, guestCheckinMessage, finishedCheckinMessage } =
    useMemo(() => getCheckinInfo(bookingData, profile), [bookingData, profile]);

  return (
    <View style={styles.gap}>
      {finishedCheckinMessage ? (
        <View style={styles.finishedCheckinMessageContainer}>
          <Iconz name="check-circle" size={16} fill="#54B835" />
          <Text style={styles.finishedCheckinMessageText} type="Subtitle">
            {finishedCheckinMessage}
          </Text>
        </View>
      ) : !isSelfCheckInDone ? (
        <Button
          onPress={checkin}
          subtitle="Smart explorers check-in early & chill! 😎"
        >
          Finish Web Check-in
        </Button>
      ) : null}
      {bookingData && bookingData.guests.length > 1 && guestCheckinMessage && (
        <Chip
          background="Inputbox"
          curve={12}
          style={styles.guestCheckinMessage}
        >
          <Text style={styles.guestCheckinMessageText} type="Subtitle">
            {guestCheckinMessage}
          </Text>
          <SmallButton textStyle="SubtitleHighlight" onPress={shareCheckin}>
            Share
          </SmallButton>
        </Chip>
      )}
      <Divider marginBottom={12} marginTop={8} />
    </View>
  );
};

export default memo(CheckinSection);

const styles = StyleSheet.create({
  gap: { gap: 16 },
  guestCheckinMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  guestCheckinMessageText: {
    flex: 1,
  },
  finishedCheckinMessageContainer: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  finishedCheckinMessageText: { flex: 1, color: "#54B835" },
});
