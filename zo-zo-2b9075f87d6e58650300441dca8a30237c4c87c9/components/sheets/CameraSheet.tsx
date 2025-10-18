import helpers from "@/utils/styles/helpers";
import {
  CameraRuntimeError,
  useCameraPermission,
} from "react-native-vision-camera";
import { useCameraDevice } from "react-native-vision-camera";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, PhotoFile } from "react-native-vision-camera";
import { Platform, StyleSheet, View } from "react-native";
import ImageEditor from "@react-native-community/image-editor";
import { BottomSheetScrollView, BottomSheetView } from "@gorhom/bottom-sheet";
import { openSettings } from "expo-linking";
import { useIsFocused } from "@react-navigation/native";
import { showToast } from "@/utils/toast";
import { PickerAsset } from "@/definitions/general";
import ZoImage from "@/components/ui/ZoImage";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import Iconz from "@/components/ui/Iconz";
import NoContent from "@/components/ui/NoContent";
import Pressable from "@/components/ui/Pressable";
import SafeAreaView from "@/components/ui/SafeAreaView";
import SectionTitle from "@/components/ui/SectionTitle";
import Sheet from "@/components/sheets/Base";
import DetailList, { DetailListProps } from "@/components/ui/DetailList";

interface CameraSheetProps {
  isOpen: boolean;
  aspectRatio?: number;
  name: string;
  onDismiss: () => void;
  onSubmit: (photo: PickerAsset) => void;
  details?: DetailListProps["data"];
}

const DETAILS: DetailListProps["data"] = [
  {
    id: "1",
    emoji: "🌞",
    label: "Take Photo in good light",
  },
  {
    id: "2",
    emoji: "🖼️",
    label: "Fully Visible",
  },
  {
    id: "3",
    emoji: "🚫",
    label: "No glare, blur on the ID",
  },
];

const CameraSheet = ({
  isOpen,
  aspectRatio = 1.5,
  name,
  onSubmit,
  onDismiss,
  details = DETAILS,
}: CameraSheetProps) => {
  const [photo, setPhoto] = useState<PickerAsset | null>(null);
  const camera = useRef<Camera>(null);
  const [isCameraActive, setCameraActive] = useState<boolean>(false);
  const device = useCameraDevice("back");
  const { hasPermission, requestPermission } = useCameraPermission();

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const takePicture = async () => {
    const photo = await camera.current?.takePhoto();
    if (photo) {
      const path = Platform.OS === "ios" ? photo.path : `file://${photo.path}`;
      const y = (photo.width - photo.height / aspectRatio) / 2;
      ImageEditor.cropImage(path, {
        offset: { x: 0, y },
        size: { width: photo.height, height: photo.height / aspectRatio },
      }).then((result) => {
        setPhoto({
          path: result.uri,
          mime: result.type,
          size: result.size,
          filename: result.name,
        });
      });
    }
  };

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused && hasPermission) {
      setCameraActive(true);
    }
  }, [isFocused, hasPermission]);

  const requestCameraPermission = useCallback(() => {
    openSettings();
  }, []);

  const handleSubmit = useCallback(() => {
    if (!photo) return;
    onSubmit(photo);
    onDismiss();
  }, [onSubmit, photo, onDismiss]);

  const retake = useCallback(() => {
    setPhoto(null);
  }, []);

  const onError = useCallback((error: CameraRuntimeError) => {
    showToast({
      message: error.message,
      type: "error",
    });
  }, []);

  const containerStyle = useMemo(
    () =>
      ({
        aspectRatio,
        width: "100%",
        marginTop: 24,
        borderRadius: 12,
        borderCurve: "continuous",
        overflow: "hidden",
      } as const),
    [aspectRatio]
  );

  return (
    <Sheet fullScreen isOpen={isOpen} onDismiss={onDismiss} hideHandle>
      <SafeAreaView safeArea style={helpers.stretch}>
        <View style={styles.head}>
          <Iconz
            name="cross"
            size={24}
            onPress={onDismiss}
            fillTheme="Primary"
          />
        </View>
        <BottomSheetView style={styles.container}>
          <SectionTitle noHorizontalPadding type="Title">
            {photo ? "Review " : name}
          </SectionTitle>
          <View style={helpers.stretch}>
            {!photo ? (
              isCameraActive ? (
                device ? (
                  <Chip stroke="Primary" style={containerStyle}>
                    <Camera
                      ref={camera}
                      style={helpers.absoluteEnds}
                      device={device}
                      isActive={isCameraActive}
                      photoQualityBalance="quality"
                      photo
                      onError={onError}
                    />
                  </Chip>
                ) : null
              ) : (
                <NoPermissions
                  requestCameraPermission={requestCameraPermission}
                />
              )
            ) : (
              <View style={containerStyle}>
                <ZoImage width={null} url={photo.path} contentFit="contain" />
              </View>
            )}
            {!photo && details.length ? (
              <DetailList style={styles.details} data={DETAILS} />
            ) : (
              <></>
            )}
            <View style={helpers.flex} />
            <View>
              {photo ? (
                <View style={styles.footGap}>
                  <Button onPress={handleSubmit}>Looks Good!</Button>
                  <Button variant="secondary" onPress={retake}>
                    Retake
                  </Button>
                </View>
              ) : (
                <View style={styles.footGap}>
                  <Pressable
                    disabled={!(hasPermission && isCameraActive)}
                    onPress={takePicture}
                    style={styles.circleButton}
                  >
                    <Chip
                      background={
                        hasPermission && isCameraActive ? "Zostel" : "Secondary"
                      }
                      style={styles.circle}
                    >
                      <Iconz name="zo" size={24} fillTheme="Primary" />
                    </Chip>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </BottomSheetView>
      </SafeAreaView>
    </Sheet>
  );
};

const NoPermissions = memo(
  ({ requestCameraPermission }: { requestCameraPermission: () => void }) => (
    <View style={helpers.flexCenter}>
      <NoContent
        source={require("@/assets/lottie/no-camera.json")}
        title="I am not able to see!"
        btnProps={{
          title: "Let me see",
          onPress: requestCameraPermission,
        }}
      />
    </View>
  )
);

const styles = StyleSheet.create({
  head: {
    paddingHorizontal: 24,
    height: 56,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  noContent: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 90,
  },
  footGap: {
    marginBottom: 8,
    gap: 8,
  },
  circleButton: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 64,
    justifyContent: "center",
    alignItems: "center",
  },
  details: {
    marginTop: 24,
    gap: 16,
  },
});

export default CameraSheet;
