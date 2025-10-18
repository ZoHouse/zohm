import { memo, useEffect, useMemo } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const AnimatedOverlay = memo(({ show }: { show: boolean }) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(Number(show));
  }, [show]);

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFillObject,
        { backgroundColor: "rgba(0,0,0,0.7)" },
        opacityStyle,
      ]}
    />
  );
});

export default AnimatedOverlay;
