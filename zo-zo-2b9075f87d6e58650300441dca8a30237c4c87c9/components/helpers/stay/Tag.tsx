import { Text } from "@/components/ui";
import { Operator } from "@/definitions/discover";
import { memo } from "react";
import { StyleSheet, View } from "react-native";

const Tag = memo(
  ({
    item,
  }: {
    item: Operator["tags"][number] & { icon?: React.JSX.Element };
  }) => (
    <View style={styles.tag}>
      {item.icon ? item.icon : <Text type="Subtitle">{item.emoji}</Text>}
      <View style={styles.flex}>
        <Text type="Tertiary" color="Secondary">
          {item.title}
        </Text>
        <Text>{item.subtitle}</Text>
      </View>
    </View>
  )
);

export default memo(Tag);

const styles = StyleSheet.create({
  tag: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  flex: {
    flex: 1,
  },
});
