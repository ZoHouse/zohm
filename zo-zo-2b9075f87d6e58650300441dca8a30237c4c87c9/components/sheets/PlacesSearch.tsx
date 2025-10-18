import { StyleSheet, View } from "react-native";
import React, { memo, useCallback } from "react";
import { GooglePlace } from "@/definitions/general";
import Sheet from "@/components/sheets/Base";
import CitySearch from "@/components/helpers/common/CitySearch";
import Text from "@/components/ui/Text";

interface PlacesSearchSheetProps {
  isOpen: boolean;
  onDismiss: () => void;
  listHeader?: { title: string; onPress: () => void };
  onSelect: (place: GooglePlace) => void;
}

const snapPoints = ["85%"];

const PlacesSearchSheet = ({
  isOpen,
  onDismiss,
  listHeader,
  onSelect,
}: PlacesSearchSheetProps) => {
  const onSelectItem = useCallback(
    (place: GooglePlace) => {
      onSelect(place);
      onDismiss();
    },
    [onSelect, onDismiss]
  );

  return (
    <Sheet snapPoints={snapPoints} isOpen={isOpen} onDismiss={onDismiss}>
      <View style={styles.stretch}>
        <Text center style={styles.input} type="Title">
          See other locations 👀
        </Text>
        <CitySearch onSelect={onSelectItem} inSheet header={listHeader} />
      </View>
    </Sheet>
  );
};

export default memo(PlacesSearchSheet);

const styles = StyleSheet.create({
  stretch: {
    flex: 1,
    alignSelf: "stretch",
  },
  input: {
    marginBottom: 8,
    marginTop: 16,
  },
});
