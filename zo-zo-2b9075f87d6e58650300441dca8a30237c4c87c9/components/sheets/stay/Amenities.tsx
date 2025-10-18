import { Operator } from "@/definitions/discover";
import { Sheet } from "@/components/sheets";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { StyleSheet } from "react-native";
import { useCallback } from "react";
import { Amenity, SectionTitle, SafeAreaView } from "@/components/ui";

interface AmenitiesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  amenities: Operator["amenities"];
}

const AmenitiesSheet = ({
  isOpen,
  onClose,
  amenities,
}: AmenitiesSheetProps) => {
  const keyExtractor = useCallback((item: Operator["amenities"][number]) => {
    return String(item.id);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Operator["amenities"][number] }) => {
      return <Amenity amenity={item} />;
    },
    []
  );

  const footer = useCallback(() => {
    return <SafeAreaView safeArea="bottom" />;
  }, []);

  return (
    <Sheet
      isOpen={isOpen}
      onDismiss={onClose}
      enableDynamicSizing
      maxDynamicContentSize={640}
    >
      <SectionTitle type="Title">Amenities</SectionTitle>
      <BottomSheetFlatList
        style={styles.flex}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        data={amenities}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListFooterComponent={footer}
      />
    </Sheet>
  );
};

export default AmenitiesSheet;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  list: {
    gap: 16,
    paddingBottom: 8,
    paddingHorizontal: 24,
    paddingTop: 16
  },
});
