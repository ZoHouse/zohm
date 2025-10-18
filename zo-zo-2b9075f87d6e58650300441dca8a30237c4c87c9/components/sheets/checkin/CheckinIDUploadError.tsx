import React, { useEffect } from "react";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRef } from "react";
import { View, StyleSheet, BackHandler, Platform } from "react-native";
import { IDState } from "@/definitions/checkin";
import Sheet from "../Base";
import { Button, SafeAreaView, SectionTitle, Text } from "@/components/ui";
import helpers from "@/utils/styles/helpers";
import constants from "@/utils/constants";
import ZoImage from "@/components/ui/ZoImage";

const CheckinIDUploadErrorSheet = ({
  id,
  isVisible,
  onClose,
  onRetake,
  onUpload,
}: {
  id: IDState;
  isVisible: boolean;
  onClose: () => void;
  onRetake: () => void;
  onUpload: () => void;
}) => {
  const sheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (sheetRef.current) {
      if (isVisible) {
        sheetRef.current.present();
      } else {
        sheetRef.current.dismiss();
      }
    }
  }, [isVisible]);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }
    const backAction = () => Boolean(isVisible);

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [isVisible]);

  return (
    <Sheet
      isOpen={isVisible}
      enablePanDownToClose={false}
      disableBackdropPress
      hideHandle
      snapPoints={["70%"]}
      onDismiss={onClose}
    >
      <SafeAreaView safeArea="bottom" style={helpers.stretch}>
        <View style={styles.logo}>
          <ZoImage url={constants.assetURLS.redCross} width="xs" />
        </View>
        <View style={styles.screen}>
          <SectionTitle noHorizontalPadding type="Title">
            Couldn't scan your ID. Let's try again!
          </SectionTitle>
          <Text>
            Looks like your photo was blurry, an invalid ID, or not an ID. No
            worries! Keep your ID steady, and make sure there's no glare. You
            got this! 😎
          </Text>
        </View>
        <View style={styles.buttons}>
          {id.source === "camera" ? (
            <>
              <Button onPress={onRetake}>Retake Photo</Button>
              <Button variant="secondary" onPress={onUpload}>
                Upload from Gallery
              </Button>
            </>
          ) : (
            <>
              <Button onPress={onUpload}>Reupload Photo</Button>
              <Button variant="secondary" onPress={onRetake}>
                Take Photo
              </Button>
            </>
          )}
        </View>
      </SafeAreaView>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  logo: {
    width: 120,
    height: 120,
    alignSelf: "center",
  },
  dimensions: {
    width: 120,
    height: 120,
  },
  screen: { flex: 1, alignSelf: "stretch", paddingHorizontal: 24 },
  buttons: {
    width: "100%",
    marginTop: 24,
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 8,
  },
});

export default CheckinIDUploadErrorSheet;
