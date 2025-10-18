import { Text } from "@/components/ui";
import { useThemeColors } from "@/context/ThemeContext";
import { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";

const AdultIcon = memo(({ age }: { age: number }) => {
  const [bg] = useThemeColors([
    (isDark) => (isDark ? "Background.Inputbox" : "Background.Zostel"),
  ]);

  const style = useMemo(() => {
    return [
      styles.adultChip,
      {
        backgroundColor: bg,
      },
    ];
  }, [bg]);

  return (
    <View style={style}>
      <Text type="TertiaryHighlight" style={styles.adultChipText} color="Light">
        {age}+
      </Text>
    </View>
  );
});

export default memo(AdultIcon);

const styles = StyleSheet.create({
  adultChip: {
    borderRadius: 4,
    backgroundColor: "#FF4545",
    paddingVertical: 2,
    paddingHorizontal: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  adultChipText: {
    lineHeight: undefined,
  },
});
