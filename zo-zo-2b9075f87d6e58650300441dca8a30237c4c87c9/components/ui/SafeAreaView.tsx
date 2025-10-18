import { View, ViewProps } from "react-native";
import React, { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SafeAreaViewProps extends ViewProps {
  safeArea?: boolean | "top" | "bottom";
}

const SafeAreaView = ({
  safeArea = true,
  style,
  ...props
}: SafeAreaViewProps) => {
  const insets = useSafeAreaInsets();

  const safeStyle = useMemo(() => {
    if (!safeArea) return style;
    if (safeArea === true)
      return [
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
        style,
      ];

    if (safeArea === "top") return [{ paddingTop: insets.top }, style];

    if (safeArea === "bottom") return [{ paddingBottom: insets.bottom }, style];
  }, [safeArea, insets, style]);

  return <View style={safeStyle} {...props} />;
};

export default SafeAreaView;
