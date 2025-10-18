import { StyleSheet } from "react-native";
import React, { useMemo } from "react";
import View, { ViewProps } from "./View";
import { StrokeColorType, useThemeColors } from "@/context/ThemeContext";

type ChipProps = ViewProps & {
  curve?: number;
  stroke?: StrokeColorType;
};

const Chip = ({ curve, stroke, style, ...props }: ChipProps) => {
  const [borderColor] = useThemeColors([`Stroke.${stroke ?? "Primary"}`]);
  const _style = useMemo(
    () =>
      [
        {
          borderColor: stroke ? borderColor : "transparent",
          borderWidth: stroke ? 1 : 0,
          borderRadius: curve,
          borderCurve: "continuous",
        },
        style,
      ] as typeof style,
    [style, stroke, borderColor, curve]
  );

  return <View {...props} style={_style} />;
};

export default Chip;
