import React, { useMemo } from "react";
import { View as RNView, ViewProps as RNViewProps } from "react-native";
import { BackgroundType, useTheme } from "@/context/ThemeContext";

export type ViewProps = RNViewProps & {
  background?: BackgroundType | boolean;
};

const View: React.FC<ViewProps> = ({ background, style, ...props }) => {
  const { theme } = useTheme();

  const viewStyle = useMemo(() => {
    if (background === true) {
      return [{ backgroundColor: theme.Background.Primary }, style];
    }
    if (background) {
      return [{ backgroundColor: theme.Background[background] }, style];
    }
    return style;
  }, [background, theme, style]);

  return <RNView style={viewStyle} {...props} />;
};

export default View;
