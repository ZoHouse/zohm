import { View, StyleSheet } from "react-native";
import React, { useMemo } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeColors } from "@/context/ThemeContext";
import { AtleastTwo } from "@/definitions/general";
import SafeAreaView from "./SafeAreaView";
import helpers, { percentToHexOpacity } from "@/utils/styles/helpers";

interface GradientHeaderProps {
  children?: React.ReactNode;
  horizontalPadding?: boolean;
  colors?: string[];
  y?: number;
}

const GradientHeader = ({
  children,
  horizontalPadding,
  colors = [],
  y = 0,
}: GradientHeaderProps) => {
  const [primary] = useThemeColors(["Background.Primary"]);

  const gradient = useMemo(
    () =>
      colors.length > 1
        ? (colors as AtleastTwo<string>)
        : ([
            primary,
            `${primary}${percentToHexOpacity(85)}`,
            `${primary}${percentToHexOpacity(0)}`,
          ] as const),
    [primary, colors]
  );

  const [start, end] = useMemo(
    () => [
      { x: 0.5, y: y },
      { x: 0.5, y: 1 },
    ],
    [y]
  );

  const content = useMemo(
    () => (
      <SafeAreaView safeArea="top" style={styles.headContainer}>
        <LinearGradient
          style={helpers.absoluteFit}
          colors={gradient}
          start={start}
          end={end}
        />
        <View style={styles.headContent} children={children} />
      </SafeAreaView>
    ),
    [children, horizontalPadding, gradient]
  );

  return content;
};

const styles = StyleSheet.create({
  headContainer: {
    zIndex: 2,
    width: "100%",
    position: "absolute",
    top: 0,
  },
  headContent: {
    width: "100%",
    height: "100%",
  },
});

export default GradientHeader;
