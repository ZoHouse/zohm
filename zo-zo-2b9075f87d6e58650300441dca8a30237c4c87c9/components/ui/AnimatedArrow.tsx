import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import Iconz from "./Iconz";
import { useEffect } from "react";

const AnimatedArrow = ({ isDown, size = 16 }: { isDown: boolean, size?: number }) => {
  const sv = useSharedValue(0);

  useEffect(() => {
    sv.value = withTiming(isDown ? 1 : 0);
  }, [isDown]);

  const rotate = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sv.value * 180}deg` }],
  }));

  return (
    <Animated.View style={rotate}>
      <Iconz size={size} name={"downAngle"} fillTheme="ViewOnly" />
    </Animated.View>
  );
};

export default AnimatedArrow;
