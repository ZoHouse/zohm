import { View, StyleSheet } from "react-native";
import React, { useCallback, useState } from "react";
import { Sheet } from "@/components/sheets";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import useProfile from "@/hooks/useProfile";
import { getFullName } from "@/utils/profile";
import { triggerNotification } from "@/utils/haptics";
import { SafeAreaView, SectionTitle, TextInput, Button } from "@/components/ui";

interface NameSheetProps {
  isOpen: boolean;
  onDismiss: () => void;
}

const NameSheet = ({ isOpen, onDismiss }: NameSheetProps) => {
  const { profile, updateProfile, isUpdating, isLoading } = useProfile();
  const [name, setName] = useState(getFullName(profile));

  const updateName = useCallback(() => {
    if (!profile) return;
    const names = name.trim().split(" ");

    if (names.length > 0) {
      let data = {
        first_name: names[0],
        middle_name: "",
        last_name: "",
      };

      if (names.length === 1) {
        data = data;
      } else if (names.length === 2) {
        data = {
          first_name: names[0],
          middle_name: "",
          last_name: names[1],
        };
      } else if (names.length === 3) {
        data = {
          first_name: names[0],
          middle_name: names[1],
          last_name: names[2],
        };
      } else {
        data = {
          first_name: names[0],
          middle_name: names[1],
          last_name: names.slice(2).join(" "),
        };
      }

      updateProfile(data, {
        onSuccess: () => {
          onDismiss();
          triggerNotification("Success");
        },
      });
    }
  }, [profile, name, updateProfile, onDismiss]);

  return (
    <Sheet
      isOpen={isOpen}
      maxDynamicContentSize={600}
      enableDynamicSizing
      onDismiss={onDismiss}
      keyboardBlurBehavior="restore"
    >
      <BottomSheetView style={styles.container}>
        <SafeAreaView safeArea="bottom">
          <SectionTitle
            noHorizontalPadding
            subtitle="Should match with the name in your documents"
          >
            My full name is
          </SectionTitle>
          <TextInput
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            inSheet
            autoFocus
            numberOfLines={1}
            maxLength={42}
            style={styles.mt}
          />
          <View style={styles.minHeight} />
          <Button onPress={updateName} isLoading={isLoading || isUpdating}>
            Save
          </Button>
        </SafeAreaView>
      </BottomSheetView>
    </Sheet>
  );
};

export default NameSheet;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  mt: { marginTop: 8 },
  minHeight: { minHeight: 200 },
});
