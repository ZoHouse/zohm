import { PickerAsset } from "@/definitions/general";
import useVisibilityState from "@/hooks/useVisibilityState";
import { useCallback, useMemo } from "react";
import { openPicker } from "react-native-image-crop-picker";
import helpers from "@/utils/styles/helpers";
import { StyleSheet } from "react-native";
import ActionsSheet from "@/components/sheets/ActionsSheet";
import CameraSheet from "@/components/sheets/CameraSheet";
import Iconz from "@/components/ui/Iconz";
import View from "@/components/ui/View";
import SectionTitle from "@/components/ui/SectionTitle";
import ZoImage from "@/components/ui/ZoImage";

const styles = StyleSheet.create({
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 16,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});

const IDUpload = ({
  id,
  name,
  placeholder,
  value,
  onSelect,
  isLocal,
  onCross,
}: {
  id: string;
  name: string;
  placeholder: string;
  value?: string;
  onSelect: (asset: PickerAsset) => void;
  isLocal?: boolean;
  onCross?: () => void;
}) => {
  const [isActionsSheetOpen, showActionsSheet, hideActionsSheet] =
    useVisibilityState(false);
  const [isCameraSheetOpen, showCameraSheet, hideCameraSheet] =
    useVisibilityState(false);

  const menuItems = [
    {
      id: "1",
      title: "Open Camera",
      emoji: "📷",
      onPress: showCameraSheet,
    },
    {
      id: "2",
      title: "Upload from Library",
      emoji: "🖼️",
      onPress: () => {
        openPicker({
          enableRotationGesture: true,
          mediaType: "photo",
          freeStyleCropEnabled: true,
          forceJpg: true,
          cropping: true,
          showCropGuidelines: true,
          showCropFrame: true,
          multiple: false,
          width: 2000,
          height: 2000,
        }).then((asset) => {
          onSelect(asset as PickerAsset);
        });
      },
    },
  ];

  const onSubmitCameraPhoto = useCallback(
    (photo: PickerAsset) => {
      onSelect(photo);
      hideCameraSheet();
    },
    [onSelect]
  );

  const titleIcon = useMemo(() => {
    return isLocal ? (
      <Iconz name="cross" size={24} onPress={onCross} fillTheme="Primary" />
    ) : value ? (
      <Iconz
        name="edit"
        size={24}
        onPress={showActionsSheet}
        fillTheme="Primary"
      />
    ) : undefined;
  }, [isLocal, value, onCross, showActionsSheet]);

  return (
    <View>
      <SectionTitle content={titleIcon} noHorizontalPadding>
        {name}
      </SectionTitle>
      <View background={value ? "Input" : undefined} style={styles.imageContainer}>
        <ZoImage url={value ?? placeholder} width={null} contentFit="contain" />
        {!value && (
          <View style={helpers.absoluteCenter}>
            <Iconz
              onPress={showActionsSheet}
              fillTheme="Primary"
              name="plus"
              size={48}
            />
          </View>
        )}
      </View>
      {isActionsSheetOpen && (
        <ActionsSheet
          isOpen={isActionsSheetOpen}
          onDismiss={hideActionsSheet}
          items={menuItems}
        />
      )}
      {isCameraSheetOpen && (
        <CameraSheet
          isOpen={isCameraSheetOpen}
          onDismiss={hideCameraSheet}
          onSubmit={onSubmitCameraPhoto}
          name={name}
          aspectRatio={1}
        />
      )}
    </View>
  );
};

export default IDUpload;
