import React, { Fragment, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import helpers from "@/utils/styles/helpers";
import Sheet from "@/components/sheets/Base";
import Iconz, { Icons } from "@/components/ui/Iconz";
import Text from "@/components/ui/Text";
import Pressable from "@/components/ui/Pressable";
import SafeAreaView from "@/components/ui/SafeAreaView";
import Divider from "@/components/ui/Divider";
import SectionTitle from "@/components/ui/SectionTitle";

interface ActionsSheetProps {
  isOpen: boolean;
  onDismiss: () => void;
  items: {
    id: string;
    title: string;
    icon?: Icons;
    emoji?: string;
    onPress: () => void;
    content?: React.ReactNode;
  }[];
  title?: string;
  titleContent?: React.ReactNode;
  noDismiss?: boolean;
}

const ActionsSheet = ({
  isOpen,
  onDismiss,
  items,
  title,
  titleContent,
  noDismiss,
}: ActionsSheetProps) => {
  const renderItem = useCallback(
    ({
      item,
      index,
    }: {
      item: ActionsSheetProps["items"][number];
      index: number;
    }) => {
      const onPress = () => {
        item.onPress();
        if (!noDismiss) {
          onDismiss();
        }
      };
      return (
        <Fragment key={`${item.id}-${index}`}>
          <Pressable activeOpacity={0.8} onPress={onPress} style={styles.item}>
            {item.icon && <Iconz name={item.icon} size={16} />}
            {item.emoji && <Text>{item.emoji}</Text>}
            <Text style={helpers.flex}>{item.title}</Text>
            {item.content && item.content}
          </Pressable>
          {index !== items.length - 1 && <Divider />}
        </Fragment>
      );
    },
    [onDismiss]
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
          {title && <SectionTitle content={titleContent}>{title}</SectionTitle>}
          <View>{items.map((item, index) => renderItem({ item, index }))}</View>
        </SafeAreaView>
      </BottomSheetView>
    </Sheet>
  );
};

export default ActionsSheet;

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 16,
    minHeight: 56,
    paddingHorizontal: 24,
  },
  flex: {
    flex: 1,
  },
});
