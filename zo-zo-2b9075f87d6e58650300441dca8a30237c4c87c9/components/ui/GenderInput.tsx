import { StyleSheet } from "react-native";
import React, { Fragment, useCallback, useMemo } from "react";
import useVisibilityState from "@/hooks/useVisibilityState";
import { ProfileFields } from "@/utils/profile";
import RadioSheet from "@/components/sheets/RadioSheet";
import Iconz from "@/components/ui/Iconz";
import Pressable from "@/components/ui/Pressable";
import View from "@/components/ui/View";
import Text from "@/components/ui/Text";

export interface GenderInputProps {
  selected?: (typeof ProfileFields.gender)[number];
  onSelect: (value: (typeof ProfileFields.gender)[number]) => void;
}

const GenderInput = ({ selected, onSelect }: GenderInputProps) => {
  const [isOpen, show, hide] = useVisibilityState();

  const selectedGender = useMemo(() => {
    return ProfileFields.gender.find((g) => g.id === selected?.id);
  }, [selected]);

  const fields = useMemo(() => {
    return ProfileFields.gender.map((g) => ({
      id: g.id,
      title: g.value,
      emoji: g.icon,
    }));
  }, []);

  const handleSelect = useCallback(
    (id: string) => {
      const gender = ProfileFields.gender.find((g) => g.id === id);
      if (gender) {
        onSelect(gender);
      }
    },
    [onSelect]
  );

  return (
    <Fragment>
      <Pressable activeOpacity={0.8} onPress={show}>
        <View background="Inputbox" style={styles.container}>
          {selectedGender ? (
            <Text>{selectedGender?.value}</Text>
          ) : (
            <Text color="Secondary">Select Gender</Text>
          )}
          <Iconz name="downAngle" size={16} fillTheme="ViewOnly" />
        </View>
      </Pressable>
      {isOpen && (
        <RadioSheet
          isOpen={isOpen}
          onDismiss={hide}
          selected={selected?.id}
          onSelect={handleSelect}
          items={fields}
        />
      )}
    </Fragment>
  );
};

export default GenderInput;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    borderCurve: "continuous",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
