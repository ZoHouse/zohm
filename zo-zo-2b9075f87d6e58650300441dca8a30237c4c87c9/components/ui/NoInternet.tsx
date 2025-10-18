import { memo, useMemo } from "react";
import { Portal } from "@gorhom/portal";
import { useNetworkState } from "expo-network";
import LottieView from "lottie-react-native";
import { StyleSheet } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import SafeAreaView from "./SafeAreaView";
import Text from "./Text";
import { LinearGradient } from "expo-linear-gradient";
import helpers from "@/utils/styles/helpers";

const colors = ["#F1563F", "#F1563F", "#F1563F00"] as const;
const NoInternet = memo(() => {
  const { isConnected } = useNetworkState();

  if (isConnected !== false) return null;

  return (
    <Portal>
      <Animated.View
        style={styles.container}
        entering={FadeInUp}
        exiting={FadeOutUp}
      >
        <LinearGradient colors={colors} style={helpers.absoluteEnds} />
        <SafeAreaView safeArea="top" />
        <Text center type="Title" color="Light" style={styles.text}>
          No Internet!{"\n"}Check your connection
        </Text>
        <LottieView
          source={require("@/assets/lottie/no-internet.json")}
          key="no-internet"
          loop
          autoPlay
          style={styles.lottie}
        />
      </Animated.View>
    </Portal>
  );
});

const styles = StyleSheet.create({
  lottie: {
    width: 80,
    height: 80,
    marginTop: 16,
  },
  container: {
    padding: 24,
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 90,
  },
  text: {
    fontFamily: "Kalam-Bold",
  },
});

export default NoInternet;
