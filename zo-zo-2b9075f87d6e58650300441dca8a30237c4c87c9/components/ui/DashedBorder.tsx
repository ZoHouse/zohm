import { useThemeColors } from "@/context/ThemeContext";
import { memo } from "react";
import { View, StyleProp, ViewStyle, StyleSheet } from "react-native";

interface DashedBorderProps {
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
}

const DashedBorder = ({ strokeWidth = 2, style = {} }: DashedBorderProps) => {
  const [stroke] = useThemeColors(["Stroke.Primary"]);

  return (
    <View style={[styles.container, { height: strokeWidth }, style]}>
      <View
        style={[
          styles.box,
          {
            height: strokeWidth * 2,
            borderWidth: strokeWidth,
            borderColor: stroke,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  box: {
    borderStyle: "dashed",
  },
});

export default memo(DashedBorder);
