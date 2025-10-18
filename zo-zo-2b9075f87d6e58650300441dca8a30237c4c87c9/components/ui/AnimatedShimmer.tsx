import { useThemeColors } from "@/context/ThemeContext";
import helpers from "@/utils/styles/helpers";
import { memo, useEffect, useMemo } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const PulsatingShimmer = memo(({ curve }: { curve?: number }) => {
  const [bg1, bg2] = useThemeColors([
    "Background.Shimmer2",
    "Background.Shimmer",
  ]);

  const bgStyle = useMemo(
    () =>
      ({
        backgroundColor: bg1,
        width: "100%",
        height: "100%",
        borderCurve: "continuous",
        overflow: "hidden",
        borderRadius: curve ?? 0,
      } as const),
    [bg1, curve]
  );
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const bg2Style = useMemo(
    () => [helpers.fit, { backgroundColor: bg2 }, animatedStyle],
    [bg2]
  );

  return (
    <View style={bgStyle}>
      <Animated.View style={bg2Style} />
    </View>
  );
});

export default PulsatingShimmer;
