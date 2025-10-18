import React, { JSX, useMemo } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, ViewStyle } from "react-native";
import { Theme, useThemeColors } from "@/context/ThemeContext";
import SafeAreaView from "@/components/ui/SafeAreaView";

interface GradientFooterProps {
  children: JSX.Element;
  y?: number;
  style?: ViewStyle;
  color?: Theme;
}

const GradientFooter = ({
  children,
  y = 0.2,
  style: outerStyle,
  color,
}: GradientFooterProps) => {
  const [primary] = useThemeColors(["Background.Primary"]);

  const gradient = useMemo(
    () => [`${primary}00`, primary] as const,
    [primary]
  );

  const childProps = useMemo(
    () => (
      <>
        <LinearGradient
          colors={gradient}
          end={{ x: 0.5, y }}
          pointerEvents="none"
          style={StyleSheet.absoluteFillObject}
        />
        {children}
      </>
    ),
    [children, y, gradient]
  );

  const style = useMemo(() => {
    return [styles.container, outerStyle];
  }, [outerStyle]);

  return <SafeAreaView style={style} safeArea="bottom" children={childProps} />;
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 24,
  },
});

export default GradientFooter;
