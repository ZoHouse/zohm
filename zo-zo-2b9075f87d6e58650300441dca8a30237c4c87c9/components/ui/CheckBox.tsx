import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import React, { memo, useEffect, useMemo } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Theme, useThemeColors } from "@/context/ThemeContext";

interface CheckboxProps {
  isSelected: boolean;
  outline?: Theme;
  fill?: Theme;
  tick?: Theme;
  size?: number;
  strokeW?: number;
  circle?: boolean;
}

const Checkbox = ({
  isSelected,
  size = 24,
  outline = "Select.Outline",
  fill = "Select.Checked",
  tick = "Select.Tick",
  strokeW = 4,
  circle = true,
}: CheckboxProps) => {
  const [outlineColor, fillColor, tickColor] = useThemeColors([
    outline,
    fill,
    tick,
  ]);

  //   const { getColor } = useTheme();

  //   const [outlineColor, fillColor, tickColor] = useMemo(
  //     () => [outline, fill, tick].map(getColor),
  //     [outline, fill, tick]
  //   );

  const smallTickHeight = useSharedValue(0);
  const largeTickHeight = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const duration = 60;
    if (isSelected) {
      opacity.value = withTiming(1, { duration }, () => {
        smallTickHeight.value = withTiming(30, { duration }, () => {
          largeTickHeight.value = withTiming(45, { duration });
        });
      });
    } else {
      largeTickHeight.value = withTiming(0, { duration }, () => {
        smallTickHeight.value = withTiming(0, { duration }, () => {
          opacity.value = withTiming(0, { duration });
        });
      });
    }
  }, [isSelected]);

  const smallTickStyle = useAnimatedStyle(() => ({
    height: `${smallTickHeight.value}%`,
  }));

  const largeTickStyle = useAnimatedStyle(() => ({
    width: `${largeTickHeight.value}%`,
  }));

  const opacityStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const containerStyle = useMemo(
    () =>
      ({
        width: size,
        height: size,
        borderRadius: circle ? size / 2 : 4,
        overflow: "hidden",
        transform: [{ rotate: circle ? "-45deg" : "0deg" }],
      } as ViewStyle),
    [size, circle]
  );

  const boxStyle = useMemo(
    () =>
      [
        StyleSheet.absoluteFillObject,
        {
          borderRadius: circle ? size : 4,
          borderWidth: strokeW,
          borderColor: outlineColor,
        },
      ] as StyleProp<ViewStyle>,
    [circle, size, strokeW, outlineColor]
  );

  const fillStyle = useMemo(
    () =>
      [
        StyleSheet.absoluteFillObject,
        { backgroundColor: fillColor },
        opacityStyle,
      ] as StyleProp<ViewStyle>,
    [fillColor, opacityStyle]
  );

  const tickContainerStyle = useMemo(
    () =>
      ({
        width: "100%",
        height: "100%",
        transform: [{ rotate: circle ? "0deg" : "-45deg" }],
      } as ViewStyle),
    [circle]
  );

  const smallTick = useMemo(
    () =>
      [
        {
          width: "15%",
          position: "absolute",
          top: "35%",
          left: "30%",
          borderRadius: size / 2,
          backgroundColor: tickColor,
          height: "30%",
        },
        smallTickStyle,
      ] as StyleProp<ViewStyle>,
    [tickColor, smallTickStyle, size]
  );

  const largeTick = useMemo(
    () =>
      [
        {
          height: "15%",
          position: "absolute",
          top: "50%",
          left: "32%",
          borderRadius: size / 2,
          backgroundColor: tickColor,
        },
        largeTickStyle,
      ] as StyleProp<ViewStyle>,
    [tickColor, largeTickStyle, size]
  );

  return (
    <View style={containerStyle}>
      <View style={boxStyle} />
      <Animated.View style={fillStyle} />
      <View style={tickContainerStyle}>
        <Animated.View style={smallTick}></Animated.View>
        <Animated.View style={largeTick}></Animated.View>
      </View>
    </View>
  );
};

export default memo(Checkbox);
