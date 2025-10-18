import React, { Fragment, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import Sheet from "@/components/sheets/Base";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import helpers from "@/utils/styles/helpers";
import SafeAreaView from "@/components/ui/SafeAreaView";
import Text from "@/components/ui/Text";
import Divider from "@/components/ui/Divider";
import SectionTitle from "@/components/ui/SectionTitle";
import Radio from "@/components/ui/Radio";
import Pressable from "@/components/ui/Pressable";

interface RadioSheetProps {
  isOpen: boolean;
  onDismiss: () => void;
  selected?: string;
  onSelect: (id: string) => void;
  items: {
    id: string;
    title: string;
    content?: React.ReactNode;
    emoji?: string;
  }[];
  title?: string;
}

const RadioSheet = ({
  isOpen,
  onDismiss,
  items,
  title,
  selected,
  onSelect,
}: RadioSheetProps) => {
  const renderItem = useCallback(
    ({
      item,
      index,
    }: {
      item: RadioSheetProps["items"][number];
      index: number;
    }) => {
      const onPress = () => {
        onSelect(item.id);
      };
      return (
        <Fragment key={`${item.id}-${index}`}>
          <Pressable activeOpacity={0.8} onPress={onPress} style={styles.item}>
            {item.emoji && <Text>{item.emoji}</Text>}
            <Text style={helpers.flex}>{item.title}</Text>
            <Radio isSelected={item.id === selected} />
            {item.content && item.content}
          </Pressable>
          {index !== items.length - 1 && <Divider />}
        </Fragment>
      );
    },
    [selected, onSelect]
  );

  return (
    <Sheet
      isOpen={isOpen}
      onDismiss={onDismiss}
      maxDynamicContentSize={700}
      enableDynamicSizing
    >
      <BottomSheetView style={styles.flex}>
        <SafeAreaView safeArea="bottom">
          {title && <SectionTitle>{title}</SectionTitle>}
          <View>{items.map((item, index) => renderItem({ item, index }))}</View>
        </SafeAreaView>
      </BottomSheetView>
    </Sheet>
  );
};

export default RadioSheet;

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
    minHeight: 56,
    paddingHorizontal: 24,
  },
  flex: {
    flex: 1,
  },
});
