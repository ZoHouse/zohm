import { Theme, useThemeColors } from "@/context/ThemeContext";
import React, { useEffect, useMemo } from "react";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface RadioIconProps {
  outline?: Theme;
  checked?: Theme;
  fill?: Theme;
  isSelected: boolean;
  size?: number;
}

export default function Radio({
  outline = "Select.Outline",
  checked = "Select.Checked",
  fill = "Background.Primary",
  isSelected,
  size = 24,
}: RadioIconProps) {
  const thickness = useSharedValue(16);
  const outlined = useSharedValue(0);
  const [outlineColor, fillColor, checkedColor] = useThemeColors([
    outline,
    fill,
    checked,
  ]);

  const innerStyle = useAnimatedStyle(() => ({
    width: thickness.value,
    height: thickness.value,
    borderRadius: thickness.value,
  }));

  const bgStyle = useAnimatedStyle(
    () => ({
      backgroundColor: interpolateColor(
        outlined.value,
        [0, 1],
        [outlineColor, checkedColor]
      ),
    }),
    [isSelected]
  );

  useEffect(() => {
    if (isSelected) {
      thickness.value = withSpring(8, { damping: 9 });
      outlined.value = withTiming(1);
    } else {
      thickness.value = withSpring(16, { damping: 9 });
      outlined.value = withTiming(0);
    }
  }, [isSelected]);

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: 100,
          alignItems: "center",
          justifyContent: "center",
        },
        bgStyle,
      ]}
    >
      <Animated.View
        style={[
          innerStyle,
          {
            backgroundColor: fillColor,
          },
        ]}
      />
    </Animated.View>
  );
}
