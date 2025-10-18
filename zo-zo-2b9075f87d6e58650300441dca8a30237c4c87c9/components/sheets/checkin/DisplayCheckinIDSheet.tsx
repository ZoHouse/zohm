import { Operator } from "@/definitions/discover";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Sheet from "../Base";
import {
  Button,
  Iconz,
  SafeAreaView,
  SectionTitle,
  Text,
} from "@/components/ui";

const DisplayCheckinIDSheet = ({
  isVisible,
  ids,
  onCameraClick,
  onGalleryClick,
  onClose,
}: {
  isVisible: boolean;
  ids: Operator["kyc_documents"];
  onCameraClick: (side?: "front" | "back") => void;
  onGalleryClick: (side?: "front" | "back") => void;
  onClose: () => void;
}) => {
  return (
    <Sheet isOpen={isVisible} onDismiss={onClose} snapPoints={["50%"]}>
      <SafeAreaView safeArea="bottom" style={styles.screen}>
        <SectionTitle type="Title" noHorizontalPadding>
          Just one ID needed
        </SectionTitle>
        <BottomSheetScrollView showsVerticalScrollIndicator={false}>
          {ids?.map((id) => (
            <View key={id.name} style={styles.item}>
              <Iconz name="check-circle" size={16} fillTheme="ViewOnly" />
              <Text>{id.name}</Text>
            </View>
          ))}
        </BottomSheetScrollView>
        <View style={styles.buttons}>
          <Button onPress={() => onCameraClick()}>Click Photo</Button>
          <Button onPress={() => onGalleryClick()} variant="secondary">
            Upload From Gallery
          </Button>
        </View>
      </SafeAreaView>
    </Sheet>
  );
};

export default DisplayCheckinIDSheet;

const styles = StyleSheet.create({
  buttons: { marginTop: 24, marginBottom: 16, gap: 16 },
  item: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 12,
  },
  list: { flex: 1 },
  screen: {
    flex: 1,
    alignSelf: "stretch",
    paddingHorizontal: 24,
  },
});
