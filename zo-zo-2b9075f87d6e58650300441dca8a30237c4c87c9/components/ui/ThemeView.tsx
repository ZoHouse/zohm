import React, { memo, useMemo } from "react";
import { View as RNView, ViewProps as RNViewProps } from "react-native";
import { Theme, useTheme } from "@/context/ThemeContext";

export type ThemeViewProps = RNViewProps & {
  theme?: Theme;
};

const ThemeView: React.FC<ThemeViewProps> = ({
  theme: _theme,
  style,
  ...props
}) => {
  const { getColor } = useTheme();

  const viewStyle = useMemo(() => {
    if (_theme) {
      return [{ backgroundColor: getColor(_theme) }, style];
    }
    return style;
  }, [_theme, getColor, style]);

  return <RNView style={viewStyle} {...props} />;
};

export default memo(ThemeView);
