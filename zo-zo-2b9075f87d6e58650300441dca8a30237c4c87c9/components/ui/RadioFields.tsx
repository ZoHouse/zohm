import React, { Fragment, useCallback, useMemo } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import helpers from "@/utils/styles/helpers";
import { Pressable, Text, Divider, Radio } from "@/components/ui";

interface RadioFieldsProps<T extends { id: string }> {
  selected?: string;
  onSelect: (id: string) => void;
  items: (T & {
    emoji?: string;
    title: string;
    subContent?: React.ReactNode;
    disabled?: boolean;
  })[];
  onSelectItem?: (item: T) => void;
  itemStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  gap?: number;
}

const RadioFields = <T extends { id: string }>({
  items,
  selected,
  onSelect,
  onSelectItem,
  style,
  itemStyle: _itemStyle,
  gap = 8,
}: RadioFieldsProps<T>) => {
  const itemStyle = useMemo(() => [styles.item, _itemStyle], [_itemStyle]);

  return (
    <View style={style}>
      {items.map((item, index) => {
        const onPress = () =>
          onSelectItem ? onSelectItem(item) : onSelect(item.id);
        return (
          <Fragment key={item.id}>
            <Pressable
              onPress={onPress}
              disabled={item.disabled}
              activeOpacity={0.8}
            >
              <View style={itemStyle}>
                {item.emoji && <Text>{item.emoji}</Text>}
                <View style={styles.flex}>
                  {item.title ? <Text>{item.title}</Text> : null}
                  {item.subContent ? item.subContent : null}
                </View>
                {!item.disabled ? (
                  <Radio isSelected={item.id === selected} />
                ) : null}
              </View>
            </Pressable>
            {items.length > 1 && index !== items.length - 1 && (
              <Divider marginTop={gap} marginBottom={gap} />
            )}
          </Fragment>
        );
      })}
    </View>
  );
};

export default RadioFields;

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 16,
  },
  flex: {
    flex: 1,
  },
});
