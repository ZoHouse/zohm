import { StyleSheet, View } from "react-native";
import { useMemo } from "react";
import moment from "moment";
import { Iconz, Pressable, Text, ThemeView } from "@/components/ui";
import helpers from "@/utils/styles/helpers";
import device from "@/config/Device";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeColors } from "@/context/ThemeContext";
import ZoImage from "@/components/ui/ZoImage";

const BOOKING_STATUS_COLOR = {
  pending: { color: "Secondary", text: "Pending" },
  confirmed: { color: "Primary", text: "Confirmed" },
  cancelled: { color: "Secondary", text: "Cancelled" },
  noshow: { color: "Secondary", text: "No Show" },
  checked_in: { color: "Primary", text: "Checked In" },
  checked_out: { color: "Primary", text: "Checked Out" },
} as const;

const [start, end] = [
  { x: 0.5, y: 0.5 },
  { x: 0.5, y: 1 },
];

const CardBookingItem = ({
  imageUrl,
  name,
  status,
  startDate,
  endDate,
  onPress,
}: {
  imageUrl: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  onPress: () => void;
}) => {
  const bookingStatus =
    BOOKING_STATUS_COLOR[status as keyof typeof BOOKING_STATUS_COLOR]?.text;

  const [dark] = useThemeColors(["Vibes.Dark"]);
  const gradientColors = useMemo(
    () => [`${dark}00`, `${dark}99`, dark] as const,
    [dark]
  );

  const color = useMemo(
    () =>
      ["confirmed", "checked_in"].includes(status) ? "Success" : "Progress",
    [status]
  );

  const icon = useMemo(() => {
    if (status === "confirmed") return "check-circle";
    if (status === "checked_in") return "arrow-right";
    if (status === "pending" || status === "requested") return "clock";
    return null;
  }, [status]);

  return (
    <Pressable activeOpacity={0.8} style={styles.tripItem} onPress={onPress}>
      <View style={helpers.absoluteFit}>
        <ZoImage url={imageUrl} width="m" />
      </View>
      <LinearGradient
        style={helpers.absoluteFit}
        start={start}
        end={end}
        colors={gradientColors}
      />
      <View style={helpers.flex} />
      <View style={styles.tripDates}>
        <Text type="TextHighlight" color="Light">{name}</Text>
        <Text color="Light" type="Subtitle">
          {moment(startDate).format("DD MMM")}
          {" → "}
          {moment(endDate).format("DD MMM")}
        </Text>
      </View>
      <ThemeView style={styles.tag} theme={`Status.${color}`}>
        {icon && <Iconz size={12} name={icon} theme={`Text.${color}`} />}
        <Text color={color} type="Tertiary" style={styles.capitalize}>
          {bookingStatus}
        </Text>
      </ThemeView>
    </Pressable>
  );
};

export default CardBookingItem;

const styles = StyleSheet.create({
  capitalize: {
    textTransform: "capitalize",
  },
  tag: {
    position: "absolute",
    top: 16,
    left: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 100,
    borderCurve: "continuous",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tripItem: {
    width: "100%",
    aspectRatio: 312 / 260,
    borderRadius: 16,
    borderCurve: "continuous",
    overflow: "hidden",
    marginVertical: 8,
  },
  tripDates: { padding: 24, gap: 4 },
});
