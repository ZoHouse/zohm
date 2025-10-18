import { useThemeColors } from "@/context/ThemeContext";
import React, { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface DividerProps {
  paddingLeft?: number;
  paddingRight?: number;
  marginTop?: number;
  marginBottom?: number;
}

const Divider: React.FC<DividerProps> = ({
  paddingLeft,
  paddingRight,
  marginBottom,
  marginTop,
}) => {
  const [fill] = useThemeColors(["Stroke.Primary"]);

  const style = useMemo(
    () =>
      ({
        width: "100%",
        paddingLeft,
        paddingRight,
        marginBottom,
        marginTop,
      } as const),
    [paddingLeft, paddingRight, marginBottom, marginTop]
  );

  const colors = useMemo(
    () => [`transparent`, fill, `transparent`] as const,
    [fill]
  );

  return (
    <View style={style}>
      <LinearGradient
        style={styles.gradient}
        colors={colors}
        start={start}
        end={end}
      />
    </View>
  );
};

const start = { x: 0, y: 0.5 };
const end = { x: 1, y: 0.5 };

export default memo(Divider);

const styles = StyleSheet.create({
  gradient: {
    width: "100%",
    height: 1,
  },
});
