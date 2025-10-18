import device from "@/config/Device";
import { memo, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Text from "./Text";
import Ziew from "./View";
import Chip from "./Chip";
import { useThemeColors } from "@/context/ThemeContext";

const sliderWidth = device.WINDOW_WIDTH - 96;
const INDICATOR_WIDTH = 20;

interface DoubleSliderProps {
  min?: number;
  max?: number;
  diff?: number;
  leftValue: {
    value: number;
    position: number;
  } | null;
  rightValue: {
    value: number;
    position: number;
  } | null;
  setLeftValue: React.Dispatch<
    React.SetStateAction<{
      value: number;
      position: number;
    } | null>
  >;
  setRightValue: React.Dispatch<
    React.SetStateAction<{
      value: number;
      position: number;
    } | null>
  >;
}

const DoubleSlider = ({
  min = 0,
  max = 200,
  diff = 10,
  leftValue: leftValueProp,
  rightValue: rightValueProp,
  setLeftValue: setLeftValueProp,
  setRightValue: setRightValueProp,
}: DoubleSliderProps) => {
  const { sliderPointsDiff, findNearestPoint } = useMemo(() => {
    const sliderPoints = Array.from({ length: (max - min) / diff }, (_, i) => ({
      value: min + i * diff,
      position: Math.floor((sliderWidth * (min + i * diff)) / (max - min)),
    })).concat([{ value: max, position: sliderWidth }]);

    const sliderPointsDiff =
      sliderPoints[1].position - sliderPoints[0].position;

    const findNearestPoint = (x: number) => {
      "worklet";
      const point = sliderPoints.reduce((prev, curr) => {
        return Math.abs(curr.position - x) < Math.abs(prev.position - x)
          ? curr
          : prev;
      });
      return point;
    };

    return { sliderPointsDiff, findNearestPoint };
  }, [min, max, diff]);

  const [leftValue, setLeftValue] = useState(
    leftValueProp ?? findNearestPoint(0)
  );
  const [rightValue, setRightValue] = useState(
    rightValueProp ?? findNearestPoint(sliderWidth)
  );
  const txLeft = useSharedValue(leftValue.position);
  const txRight = useSharedValue(rightValue.position - sliderWidth);

  // useEffect(() => {
  //   setLeftValueProp(value => (!value ? findNearestPoint(0) : value));
  //   setRightValueProp(value =>
  //     !value ? findNearestPoint(sliderWidth) : value,
  //   );
  // }, []);

  const gestureLeft = Gesture.Pan()
    .onUpdate((event) => {
      const tx = event.absoluteX - 48;
      const maxTx = txRight.value + sliderWidth - sliderPointsDiff;
      if (tx >= 0 && tx < maxTx) {
        txLeft.value = tx;
        const nearestPoint = findNearestPoint(txLeft.value);
        runOnJS(setLeftValue)(nearestPoint);
      }
    })
    .onEnd(() => {
      const nearestPoint = findNearestPoint(txLeft.value);
      txLeft.value = withTiming(nearestPoint.position);
      runOnJS(setLeftValueProp)(nearestPoint);
    });

  const gestureRight = Gesture.Pan()
    .onUpdate((event) => {
      const tx = event.absoluteX - (sliderWidth + 48);
      const minTx = txLeft.value - sliderWidth + sliderPointsDiff;
      if (tx <= 0 && tx >= minTx) {
        txRight.value = tx;
        const nearestPoint = findNearestPoint(sliderWidth + txRight.value);
        runOnJS(setRightValue)(nearestPoint);
      }
    })
    .onEnd(() => {
      const nearestPoint = findNearestPoint(sliderWidth + txRight.value);
      txRight.value = withTiming(nearestPoint.position - sliderWidth);
      runOnJS(setRightValueProp)(nearestPoint);
    });

  const animatedStyleLeft = useAnimatedStyle(() => ({
    transform: [{ translateX: txLeft.value }],
  }));

  const animatedStyleRight = useAnimatedStyle(() => ({
    transform: [{ translateX: txRight.value }],
  }));

  const animatedStyleTrack = useAnimatedStyle(() => ({
    left: txLeft.value,
    right: txRight.value,
    width: sliderWidth - txLeft.value + txRight.value,
  }));

  const [inputColor, buttonColor] = useThemeColors([
    "Background.Inputbox",
    "Button.Primary",
  ]);

  const trackStyle = useMemo(
    () => [
      styles.innerTrack,
      animatedStyleTrack,
      { backgroundColor: buttonColor },
    ],
    [buttonColor, animatedStyleTrack]
  );

  const indicatorStyle = useMemo(
    () => [
      styles.indicator,
      animatedStyleLeft,
      { backgroundColor: buttonColor },
    ],
    [buttonColor, animatedStyleLeft]
  );

  const indicatorRightStyle = useMemo(
    () => [
      styles.indicatorRight,
      animatedStyleRight,
      { backgroundColor: buttonColor },
    ],
    [buttonColor, animatedStyleRight]
  );

  const trackBgStyle = useMemo(
    () => [styles.track, { backgroundColor: inputColor }],
    [inputColor]
  );

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        <View style={trackBgStyle} />
        <Animated.View style={trackStyle} />
        <GestureDetector gesture={gestureLeft}>
          <Animated.View style={indicatorStyle}>
            <Ziew background style={styles.indicatorIn} />
          </Animated.View>
        </GestureDetector>
        <GestureDetector gesture={gestureRight}>
          <Animated.View style={indicatorRightStyle}>
            <Ziew background style={styles.indicatorIn} />
          </Animated.View>
        </GestureDetector>
      </View>
      {leftValue && rightValue ? (
        <View style={styles.priceContainer}>
          <Chip background="Input" curve={16} style={styles.priceContainerItem}>
            <Text type="Subtitle" color="Secondary">
              Minimum
            </Text>
            <Text>{(leftValue.value * 1000).toLocaleString()}</Text>
          </Chip>
          <Chip
            background="Input"
            curve={16}
            style={styles.priceContainerItemR}
          >
            <Text type="Subtitle" color="Secondary">
              Maximum
            </Text>
            <Text>{(rightValue.value * 1000).toLocaleString()}</Text>
          </Chip>
        </View>
      ) : null}
    </View>
  );
};

export default memo(DoubleSlider);

const styles = StyleSheet.create({
  bar: {
    alignSelf: "stretch",
    marginHorizontal: 24,
    height: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  track: {
    width: "100%",
    height: 4,
    position: "absolute",
    // backgroundColor: Colors.Background.Input,
  },
  innerTrack: {
    height: 4,
    // backgroundColor: Colors.Button.Primary,
    position: "absolute",
  },
  indicator: {
    width: INDICATOR_WIDTH,
    height: INDICATOR_WIDTH,
    // backgroundColor: "red",
    borderRadius: INDICATOR_WIDTH,
    position: "absolute",
    left: -INDICATOR_WIDTH / 2,
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  indicatorIn: { flex: 1, alignSelf: "stretch", borderRadius: 16 },
  indicatorRight: {
    width: INDICATOR_WIDTH,
    height: INDICATOR_WIDTH,
    // backgroundColor: "red",
    borderRadius: INDICATOR_WIDTH,
    position: "absolute",
    right: -INDICATOR_WIDTH / 2,
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceContainerItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 124,
  },
  priceContainerItemR: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 124,
    alignItems: "flex-end",
  },
  container: {
    gap: 16,
  },
});
