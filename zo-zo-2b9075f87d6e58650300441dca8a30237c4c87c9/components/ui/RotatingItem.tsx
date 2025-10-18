import { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

interface RotatingViewProps {
  children: React.ReactNode;
}

const RotatingView = ({ children }: RotatingViewProps) => {
  const angle = useSharedValue(0);

  useEffect(() => {
    angle.value = withRepeat(
      withTiming(360, {
        duration: 1000,
        easing: Easing.out(Easing.ease),
      }),
      -1,
      false
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${angle.value}deg`,
      },
    ],
  }));

  return children ? (
    <Animated.View style={style}>{children}</Animated.View>
  ) : null;
};

export default RotatingView;
