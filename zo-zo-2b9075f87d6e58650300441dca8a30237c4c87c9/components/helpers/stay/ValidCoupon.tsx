import { Iconz, Pressable, Text, ThemeView } from "@/components/ui";
import { memo } from "react";
import { StyleSheet } from "react-native";
import Animated, { FadeInRight, FadeOutRight } from "react-native-reanimated";

const ValidCoupon = ({ onClear }: { onClear: () => void }) => {
  return (
    <Animated.View
      entering={FadeInRight.springify()}
      exiting={FadeOutRight}
      style={styles.row}
    >
      <ThemeView theme="Status.Success" style={styles.container}>
        <Text type="Subtitle" color="Success">
          😊 Applied
        </Text>
      </ThemeView>
      <Pressable activeOpacity={0.8} onPress={onClear} style={styles.clear}>
        <Iconz name="cross-circle" size={20} fillTheme="Primary" />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 100,
    borderCurve: "continuous",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  row: { flexDirection: "row", alignItems: "center" },
  clear: { paddingLeft: 8 },
});

export default memo(ValidCoupon);
