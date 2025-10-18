import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { ZoToken } from "../common/ZoToken";
import Text from "@/components/ui/Text";

const ZoChip = memo((props: { amount: number }) => (
  <View style={styles.zoChip}>
    <Text style={styles.darkBg} type="Tertiary">
      {props.amount}
    </Text>
    <ZoToken style={styles.zoToken} />
  </View>
));

const styles = StyleSheet.create({
  zoChip: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#11111129",
    borderRadius: 100,
    borderCurve: "continuous",
  },
  darkBg: {
    color: "#111111",
  },
  zoToken: { width: 16, height: 16, borderRadius: 16 },
});

export default ZoChip;
