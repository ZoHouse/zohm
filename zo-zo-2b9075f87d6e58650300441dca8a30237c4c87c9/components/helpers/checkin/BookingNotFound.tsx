import { Text } from "@/components/ui";
import LottieView from "lottie-react-native";
import { memo } from "react";
import { StyleSheet, View } from "react-native";

const BookingNotFound = memo(() => (
  <View style={styles.view}>
    <LottieView
      source={require("@/assets/lottie/booking-not-found.json")}
      autoPlay
      loop
      style={styles.lottie}
      resizeMode="contain"
    />
    <Text center type="Title">
      No booking found!
    </Text>
    <Text center>Paste or enter your Booking ID</Text>
  </View>
));

export default BookingNotFound;

const styles = StyleSheet.create({
  lottie: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  view: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    gap: 4,
  },
});
