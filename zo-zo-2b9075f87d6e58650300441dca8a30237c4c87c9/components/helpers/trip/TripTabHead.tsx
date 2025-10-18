import { Iconz, SafeAreaView } from "@/components/ui";
import { useThemeColors } from "@/context/ThemeContext";
import { memo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  interpolateColor,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import TripSearchBar from "./TripSearchBar";

const TripTabHeader = memo(({ isBlack }: { isBlack: SharedValue<number> }) => {
  const [primary] = useThemeColors(["Background.Primary"]);

  const headerStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      isBlack.value,
      [1, 0],
      ["#000000", primary],
      "RGB"
    );

    return {
      backgroundColor,
    };
  });

  return (
    <Animated.View style={headerStyle}>
      <View style={styles.bg} />
      <SafeAreaView safeArea="top">
        <View style={styles.container}>
          {/* <Iconz name="arrow-left" size={24} fillTheme="Primary" /> */}
          <TripSearchBar />
        </View>
      </SafeAreaView>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  bg: {
    position: "absolute",
    width: "100%",
    bottom: 0,
    left: 0,
    backgroundColor: "black",
    height: 400,
    transform: [{ translateY: 400 }],
  },
});

export default memo(TripTabHeader);
