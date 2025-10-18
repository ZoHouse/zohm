import {
  Chip,
  Pressable,
  SafeAreaView,
  SmallButton,
  Text,
} from "@/components/ui";
import { FilterValue } from "@/definitions/trip";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import Ziew from "@/components/ui/View";
import Sheet from "../Base";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";

interface TripSortSheetProps {
  isOpen: boolean;
  onClose: () => void;
  values: FilterValue[];
  selectedValue: FilterValue | null;
  onSelect: (value: FilterValue | null) => void;
}

export default function TripSortSheet({
  isOpen,
  onClose,
  values,
  selectedValue: selectedValueProp,
  onSelect: onSelectProp,
}: TripSortSheetProps) {
  const [selectedValue, setSelectedValue] = useState<FilterValue | null>(
    selectedValueProp
  );

  const onDone = useCallback(() => {
    onSelectProp(selectedValue);
    onClose();
  }, [selectedValue, onSelectProp, onClose]);

  const onClear = useCallback(() => {
    setSelectedValue(null);
    onSelectProp(null);
    onClose();
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: FilterValue }) => {
      const isSelected = selectedValue?.code === item.code;
      return (
        <Pressable
          activeOpacity={0.8}
          onPress={() => setSelectedValue(isSelected ? null : item)}
        >
          {isSelected ? (
            <Chip background="Inputbox" curve={8} style={styles.item}>
              <Text type="Subtitle">{item.name}</Text>
            </Chip>
          ) : (
            <View style={styles.item}>
              <Text type="Subtitle">{item.name}</Text>
            </View>
          )}
        </Pressable>
      );
    },
    [selectedValue]
  );

  return (
    <Sheet snapPoints={["50%"]} isOpen={isOpen} onDismiss={onClose}>
      <View style={styles.title}>
        <Text type="TextHighlight">Sort By</Text>
      </View>
      <SafeAreaView style={styles.container} safeArea="bottom">
        <BottomSheetFlatList
          data={values}
          contentContainerStyle={styles.contentContainer}
          renderItem={renderItem}
          style={styles.list}
          keyExtractor={(item) => item.code}
        />
        <View style={styles.footer}>
          <Pressable onPress={onClear}>
            <Text type="SubtitleHighlight">Clear</Text>
          </Pressable>
          <SmallButton onPress={onDone}>Show Trips</SmallButton>
        </View>
      </SafeAreaView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  item: {
    padding: 16,
    paddingVertical: 12,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 8,
  },
  title: {
    padding: 12,
    paddingLeft: 24,
  },
  list: {
    flex: 1,
  },
  footer: {
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
  },
});
