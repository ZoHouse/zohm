import { Pressable, SectionTitle, Text } from "@/components/ui";
import DetailList from "@/components/ui/DetailList";
import { IDState } from "@/definitions/checkin";
import { openSettings } from "expo-linking";
import LottieView from "lottie-react-native";
import { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import {
  Camera,
  PhotoFile,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import ImageEditor from "@react-native-community/image-editor";
import { Image } from "expo-image";

const data = [
  {
    id: "landscape",
    emoji: "📇",
    label: "Hold your ID in landscape mode",
  },
  {
    id: "lighting",
    emoji: "☀️",
    label: "Use good lighting & keep it fully visible",
  },
  {
    id: "quality",
    emoji: "🚫",
    label: "Avoid glare, flash, and blur",
  },
  {
    id: "surface",
    emoji: "💡",
    label: "Place your ID on a flat surface for good contrast",
  },
];

const IDCapture = ({
  id,
  captureRef,
}: {
  id: IDState;
  captureRef: React.RefObject<
    ((cb: (file: IDState["front"]) => void) => void) | undefined
  >;
}) => {
  const [photo, setPhoto] = useState<PhotoFile | null>(null);
  const camera = useRef<Camera>(null);
  const [isCameraActive, setCameraActive] = useState<boolean>(false);
  const device = useCameraDevice("back");
  const { hasPermission, requestPermission } = useCameraPermission();

  useEffect(() => {
    if (hasPermission) {
      setCameraActive(true);
    } else {
      requestPermission();
    }
  }, [hasPermission]);

  useEffect(() => {
    return () => {
      setPhoto(null);
    };
  }, []);

  const takePicture = (cb: (file: IDState["front"]) => void) => {
    const aspectRatio = 312 / 205;
    const photo = camera.current?.takePhoto();
    photo?.then((photo) => {
      if (photo) {
        const path =
          Platform.OS === "ios" ? photo.path : `file://${photo.path}`;
        const y = (photo.width - photo.height / aspectRatio) / 2;
        ImageEditor.cropImage(path, {
          offset: { x: 0, y },
          size: { width: photo.height, height: photo.height / aspectRatio },
        }).then((result) => {
          cb({ path: result.uri });
        });
      }
    });
  };

  captureRef.current = takePicture;

  return (
    <View style={styles.pt}>
      <SectionTitle noHorizontalPadding type="Title">
        {id.side === "front" ? "ID Card Front" : "ID Card Back"}
      </SectionTitle>
      <View style={styles.screen}>
        <View style={styles.cameraContainer}>
          {!photo ? (
            isCameraActive ? (
              device != null && (
                <Camera
                  ref={camera}
                  style={StyleSheet.absoluteFill}
                  device={device}
                  isActive={isCameraActive}
                  photoQualityBalance="quality"
                  video
                  photo
                  onError={console.log}
                />
              )
            ) : (
              <View style={styles.noPermissionContainer}>
                <LottieView
                  source={require("@/assets/lottie/no-camera.json")}
                  autoPlay
                  loop
                  style={styles.lottie}
                />
                <Text
                  style={styles.noPermissionTitle}
                  type="Subtitle"
                  color="Light"
                >
                  I am not able to see!
                </Text>
                <Pressable onPress={openSettings}>
                  <Text
                    type="BigButton"
                    color="Button"
                    style={styles.noPermissionAction}
                  >
                    Let me see
                  </Text>
                </Pressable>
              </View>
            )
          ) : (
            <Image
              source={{ uri: photo?.path }}
              style={StyleSheet.absoluteFillObject}
              contentFit="contain"
            />
          )}
        </View>
      </View>
      <DetailList gap={8} data={data} />
    </View>
  );
};

const styles = StyleSheet.create({
  noPermissionContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
  lottie: {
    width: 56,
    height: 56,
    marginTop: 16,
  },
  noPermissionTitle: {
    marginTop: 16,
  },
  noPermissionAction: {
    padding: 16,
  },
  pt: {
    paddingTop: 16,
  },
  screen: {
    marginTop: 8,
    marginBottom: 24,
    alignSelf: "stretch",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraContainer: {
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: "#11111129",
    borderRadius: 12,
    borderCurve: "continuous",
    width: "100%",
    overflow: "hidden",
  },
});

export default IDCapture;
