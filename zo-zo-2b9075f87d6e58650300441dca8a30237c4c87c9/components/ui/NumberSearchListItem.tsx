import { StyleSheet } from "react-native";
import React, { useCallback } from "react";
import { CountryCodeType } from "@/definitions/auth";
import View from "./View";
import Text from "./Text";
import Pressable from "./Pressable";

interface NumberSearchListItemProps {
  item: CountryCodeType;
  select: (item: CountryCodeType) => void;
  isSelected: boolean;
  showDialCode?: boolean;
}

const NumberSearchListItem = ({
  item,
  select,
  isSelected,
  showDialCode = true,
}: NumberSearchListItemProps) => {
  const onPress = useCallback(() => {
    select(item);
  }, [item, select]);
  return (
    <Pressable onPress={onPress}>
      <View
        background={isSelected ? "Inputbox" : undefined}
        style={styles.countryItem}
      >
        <View style={styles.countryItemTextContainer}>
          <Text color="Primary">{item.flag}</Text>
          <Text color="Primary" numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        {!showDialCode ? null : (
          <Text
            type="TextHighlight"
            color="Primary"
            style={styles.countryItemDialCode}
          >
            {item.dial_code}
          </Text>
        )}
      </View>
    </Pressable>
  );
};

export default NumberSearchListItem;

const styles = StyleSheet.create({
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderCurve: "continuous",
    height: 56,
    gap: 12,
    paddingHorizontal: 16,
  },
  countryItemTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    overflow: "hidden",
  },
  countryItemDialCode: {
    flexShrink: 0,
  },
});
