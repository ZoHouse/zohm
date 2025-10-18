import { FlexAlignType, StyleSheet, View } from "react-native";
import Text from "./Text";
import React, { useMemo } from "react";

export interface DetailRowProps {
  emoji?: string;
  label?: string;
  value?: React.ReactNode;
  gap?: number;
  alignToTop?: boolean;
}

const DetailRow = ({
  emoji,
  label,
  value,
  gap = 8,
  alignToTop = false,
}: DetailRowProps) => {
  const style = useMemo(
    () => [
      styles.row,
      {
        gap,
        alignItems: (alignToTop ? "flex-start" : "center") as FlexAlignType,
      },
    ],
    [gap, alignToTop]
  );

  return (
    <View style={style}>
      {emoji ? <Text>{emoji}</Text> : null}
      {value ? value : label ? <Text style={styles.flex}>{label}</Text> : null}
    </View>
  );
};

export default DetailRow;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  flex: { flex: 1 },
});
