import { StyleSheet, View } from "react-native";
import React, { memo, useCallback } from "react";
import { useCurrency } from "@/context/CurrencyContext";
import { ZostelCurrency } from "@/definitions/booking";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import Sheet from "@/components/sheets/Base";
import SectionTitle from "@/components/ui/SectionTitle";
import Text from "@/components/ui/Text";
import Pressable from "@/components/ui/Pressable";
import Ziew from "@/components/ui/View";

interface CurrencySheetProps {
  onClose: () => void;
  isOpen: boolean;
}

const CurrencySheet = ({ onClose, isOpen }: CurrencySheetProps) => {
  const { allCurrencies, selectedCurrency, updateCurrency } = useCurrency();

  const renderItem = useCallback(
    ({ item }: { item: ZostelCurrency }) => {
      const onPress = () => {
        updateCurrency(item);
        onClose();
      };

      return (
        <Pressable activeOpacity={0.8} onPress={onPress}>
          <Ziew
            style={styles.item}
            background={
              selectedCurrency.id === item.id ? "Inputbox" : undefined
            }
          >
            <Text>{item.value}</Text>
          </Ziew>
        </Pressable>
      );
    },
    [selectedCurrency]
  );

  return (
    <Sheet isOpen={isOpen} onDismiss={onClose} snapPoints={["90%"]}>
      <View style={styles.flex}>
        <SectionTitle
          icon="cross"
          iconFill="Primary"
          iconSize={24}
          onIconPress={onClose}
          type="Title"
        >
          Select Currency
        </SectionTitle>
        <BottomSheetFlatList
          data={allCurrencies}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          style={styles.flex}
        />
      </View>
    </Sheet>
  );
};

export default memo(CurrencySheet);

const styles = StyleSheet.create({
  item: {
    height: 48,
    justifyContent: "center",
    paddingLeft: 16,
    borderRadius: 12,
    borderCurve: "continuous",
  },
  flex: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
});
