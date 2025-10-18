import { useCallback, useMemo } from "react";
import { useState } from "react";
import useVisibilityState from "./useVisibilityState";
import { openPicker } from "react-native-image-crop-picker";
import { AxiosProgressEvent } from "axios";
import { GeneralObject } from "@/definitions/general";
import { ActionsSheet } from "@/components/sheets";
import { axiosInstances } from "@/utils/auth/client";
import { useAuth } from "@/context/AuthContext";
import CameraSheet from "@/components/sheets/CameraSheet";

export type LibraryConfig = Parameters<typeof openPicker>[0];

const defaultConfig: LibraryConfig = {
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
};

const details = [
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
];

const useUploadMedia = (
  setValue: (value: GeneralObject[]) => void,
  config: LibraryConfig = defaultConfig,
  name: string = "Upload Media",
  aspectRatio: number = 1
) => {
  const [isUploadSheetVisible, showUploadSheet, hideUploadSheet] =
    useVisibilityState();
  const [isActionSheetVisible, setIsActionSheetVisible] = useState(false);

  const handleIdSubmit = useCallback(
    (value: GeneralObject | GeneralObject[]) => {
      if (Array.isArray(value)) {
        setValue(
          value.map((item) => ({
            name: item.filename,
            size: item.size,
            path: item.path,
            mime: item.mime,
          }))
        );
      } else {
        setValue([
          {
            name: value.filename,
            size: value.size,
            path: value.path,
            mime: value.mime,
          },
        ]);
      }
      hideUploadSheet();
    },
    [setValue, hideUploadSheet]
  );

  const mediaItems = useMemo(
    () => [
      {
        id: "1",
        title: "Open Camera",
        emoji: "📷",
        onPress: () => {
          setIsActionSheetVisible(false);
          showUploadSheet();
        },
      },
      {
        id: "2",
        title: "Upload from Library",
        emoji: "🖼️",
        onPress: () => {
          setIsActionSheetVisible(false);
          openPicker({
            ...config,
          })
            .then(handleIdSubmit)
            .catch((er) => console.warn("Error picking image: ", er.message));
        },
      },
    ],
    [setIsActionSheetVisible, showUploadSheet]
  );

  const cameraSheet = useMemo(
    () =>
      isUploadSheetVisible ? (
        <CameraSheet
          isOpen={isUploadSheetVisible}
          onDismiss={hideUploadSheet}
          name={name}
          onSubmit={handleIdSubmit}
          aspectRatio={aspectRatio}
          details={details}
        />
      ) : null,
    [isUploadSheetVisible, hideUploadSheet, handleIdSubmit, aspectRatio, name]
  );

  const mediaSheet = useMemo(
    () => (
      <ActionsSheet
        isOpen={isActionSheetVisible}
        items={mediaItems}
        onDismiss={() => setIsActionSheetVisible(false)}
      />
    ),
    [isActionSheetVisible, mediaItems]
  );

  const sheetContent = useMemo(() => {
    return (
      <>
        {cameraSheet}
        {mediaSheet}
      </>
    );
  }, [cameraSheet, mediaSheet]);

  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );

  const { getZoAuthHeaders } = useAuth();

  const uploadMediaToServer = useCallback(
    (endpoint: string, medias: GeneralObject[]) =>
      Promise.all(
        medias.map((media, index) => {
          const formData = new FormData();
          // @ts-ignore
          formData.append("file", {
            uri: media.path,
            type: media.mime || "image/jpeg",
            name: media.name || `${media.name}--image.jpg`,
          });
          formData.append("category", "image");
          formData.append(
            "metdata",
            JSON.stringify({ alt_text: "image-" + media.name })
          );
          const headers = {
            ...getZoAuthHeaders(),
            "Content-Type": "multipart/form-data",
          };
          return axiosInstances.ZO.post(endpoint, formData, {
            headers: headers as any,
            onUploadProgress: (progressEvent: AxiosProgressEvent) => {
              setUploadProgress((prev) => ({
                ...prev,
                [index]: Math.round(
                  (progressEvent.loaded * 100) / (progressEvent.total || 1)
                ),
              }));
            },
          });
        })
      ),
    []
  );

  const loadingPercent = useMemo(() => {
    const total = Math.max(1, Object.values(uploadProgress ?? {}).length);
    return Math.round(
      Object.values(uploadProgress ?? {}).reduce((acc, curr) => acc + curr, 0) /
        Math.max(1, total)
    );
  }, [uploadProgress]);

  const result = useMemo(() => {
    return {
      sheetContent,
      showUploadSheet,
      setIsActionSheetVisible,
      uploadMediaToServer,
      loadingPercent,
    };
  }, [
    sheetContent,
    showUploadSheet,
    setIsActionSheetVisible,
    uploadMediaToServer,
    loadingPercent,
  ]);

  return result;
};

export default useUploadMedia;
