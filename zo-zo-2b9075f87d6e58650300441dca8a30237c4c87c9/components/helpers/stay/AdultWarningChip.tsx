import useVisibilityState from "@/hooks/useVisibilityState";
import { memo, useMemo } from "react";
import { StyleSheet } from "react-native";
import { useThemeColors } from "@/context/ThemeContext";
import Chip from "@/components/ui/Chip";
import Pressable from "@/components/ui/Pressable";
import Text from "@/components/ui/Text";
import AdultIcon from "@/components/helpers/stay/AdultIcon";
import AlertSheet from "@/components/sheets/AlertSheet";

const AdultWarningChip = memo(({ age }: { age: number }) => {
  const [isSheetOpen, showSheet, hideSheet] = useVisibilityState(false);
  const [bg] = useThemeColors([
    (isDark) => (isDark ? "Background.Card" : "Status.Progress"),
  ]);
  const style = useMemo(() => {
    return [styles.warningChip, { backgroundColor: bg }];
  }, [bg]);

  return (
    <>
      <Pressable activeOpacity={0.8} onPress={showSheet}>
        <Chip curve={100} style={style}>
          <AdultIcon age={age} />
          <Text style={styles.warning} type="Subtitle" color="Primary">
            Only for guests aged {age} & above
          </Text>
        </Chip>
      </Pressable>
      {isSheetOpen && (
        <AlertSheet
          isOpen={isSheetOpen}
          onClose={hideSheet}
          title="Kids/Infants not allowed"
          description="To maintain safety & hostel culture, Zostel does not allow kids/infants in Zostel & Zostel Plus."
          variant="kids"
        />
      )}
    </>
  );
});

export default memo(AdultWarningChip);

const styles = StyleSheet.create({
  warningChip: {
    backgroundColor: "#FFEFD1",
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    justifyContent: "center",
  },
  warning: {
    // color: "#111",
  },
});
