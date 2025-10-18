import { StyleSheet, View } from "react-native";
import Animated, { SlideInDown } from "react-native-reanimated";
import LottieView from "lottie-react-native";
import { useEffect } from "react";
import { useAudioPlayer } from "expo-audio";
import Button from "@/components/ui/Button";
import helpers from "@/utils/styles/helpers";
import SafeAreaView from "@/components/ui/SafeAreaView";
import Iconz from "@/components/ui/Iconz";
import Text from "@/components/ui/Text";
import StayConfirmedCard from "./StayConfirmedCard";
import { ThemeProvider } from "@/context/ThemeContext";

const ConfirmSplash = ({
  onClose,
  operatorName,
  image,
  destination,
}: {
  onClose: () => void;
  operatorName: string;
  image: string;
  destination: string;
}) => {
  const audioPlayer = useAudioPlayer(require("@/assets/sounds/shine.mp3"));
  useEffect(() => {
    audioPlayer.play();
  }, []);

  return (
    <SafeAreaView safeArea style={styles.confirmedContainer}>
      <Animated.View
        entering={SlideInDown.springify().damping(25).stiffness(250)}
        style={styles.confirmedView}
      >
        <Iconz name="check-circle" size={40} fill="#fff" />
        <Text style={styles.confirmedTitle} center type="Title">
          {operatorName} stay confirmed!
        </Text>
        <View>
          <StayConfirmedCard destination={destination} image={image} />
          <View style={styles.sparkleTopRight}>
            <LottieView
              source={require("@/assets/lottie/sparkle.json")}
              style={helpers.stretch}
              key="sparkle-top-right"
              autoPlay
              loop
            />
          </View>
          <View style={styles.sparkleBottomLeft}>
            <LottieView
              source={require("@/assets/lottie/sparkle.json")}
              style={helpers.stretch}
              key="sparkle-bottom-left"
              autoPlay
              loop
            />
          </View>
        </View>
      </Animated.View>
      <ThemeProvider force="dark">
        <Button style={styles.button} onPress={onClose}>
          View Booking
        </Button>
      </ThemeProvider>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  sparkleBottomLeft: {
    width: 64,
    height: 64,
    position: "absolute",
    bottom: 0,
    left: 0,
  },
  sparkleTopRight: {
    width: 40,
    height: 40,
    position: "absolute",
    top: -24,
    right: -16,
  },
  confirmedTitle: {
    color: "#fff",
    marginTop: 16,
    marginBottom: 40,
    paddingHorizontal: 24,
  },
  confirmedContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#F1563F",
    paddingHorizontal: 24,
  },
  confirmedView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  hidden: { width: 0, height: 0, display: "none" },
  button: {
    marginBottom: 8,
  },
});

export default ConfirmSplash;
