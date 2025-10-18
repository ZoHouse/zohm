import React from "react";
import { StyleSheet, View } from "react-native";
import { BookingCancellationError } from "@/definitions/booking";
import { Sheet } from "@/components/sheets";
import device from "@/config/Device";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import constants from "@/utils/constants";
import { SafeAreaView, Text, Button } from "@/components/ui";
import ZoImage from "@/components/ui/ZoImage";

interface StayCancellationErrorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  error: BookingCancellationError;
}

const StayCancellationErrorSheet = ({
  isOpen,
  onClose,
  error,
}: StayCancellationErrorSheetProps) => {
  return (
    <Sheet
      isOpen={isOpen}
      onDismiss={onClose}
      enableDynamicSizing
      maxDynamicContentSize={device.WINDOW_HEIGHT / 1.5}
    >
      <BottomSheetView style={styles.container}>
        <SafeAreaView style={styles.flex} safeArea="bottom">
          <>
            <View style={styles.contentContainer}>
              <View style={styles.image}>
                <ZoImage
                  url={
                    error.key === "guest_error"
                      ? constants.assetURLS.profileGold
                      : constants.assetURLS.rightArrow
                  }
                  width="xs"
                />
              </View>
              <View style={styles.textContainer}>
                <Text center type="Title">
                  {error.title}
                </Text>
                <Text center>{error.description}</Text>
              </View>
            </View>
            <Button onPress={onClose}>Got It</Button>
          </>
        </SafeAreaView>
      </BottomSheetView>
    </Sheet>
  );
};

export default StayCancellationErrorSheet;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  textContainer: {
    gap: 4,
  },
  container: {
    flex: 1,
    gap: 24,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  contentContainer: {
    gap: 12,
    marginBottom: 24,
  },
  image: {
    alignSelf: "center",
    width: 120,
    height: 120,
  },
});
