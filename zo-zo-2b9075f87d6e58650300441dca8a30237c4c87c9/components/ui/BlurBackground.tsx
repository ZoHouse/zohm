import { useTheme } from "@/context/ThemeContext";
import helpers from "@/utils/styles/helpers";
import { BlurView, BlurViewProps } from "expo-blur";
import { memo, useMemo } from "react";
import { StyleProp, ViewStyle } from "react-native";

interface BlurBackgroundProps extends BlurViewProps {
  intensity?: BlurViewProps["intensity"];
  tint?: BlurViewProps["tint"];
  style?: StyleProp<ViewStyle>;
}

const BlurBackground = memo(
  ({ intensity = 60, tint, style }: BlurBackgroundProps) => {
    const { colorScheme } = useTheme();

    const defaultTint = useMemo(() => {
      if (colorScheme === "dark") {
        return "systemUltraThinMaterialDark";
      }
      return "systemUltraThinMaterialLight";
    }, [colorScheme]);

    const styles = useMemo(() => {
      return [helpers.absoluteEnds, style];
    }, [style]);

    return (
      <BlurView
        intensity={intensity}
        tint={tint || defaultTint}
        style={styles}
      />
    );
  }
);

export default memo(BlurBackground);
