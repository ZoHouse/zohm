import { StyleSheet } from "react-native";
import React, { useCallback, useMemo, useState } from "react";
import { Sheet } from "@/components/sheets";
import { ID } from "@/utils/profile";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { PickerAsset } from "@/definitions/general";
import useProfile from "@/hooks/useProfile";
import { axiosInstances } from "@/utils/auth/client";
import { useAuth } from "@/context/AuthContext";
import { logAxiosError } from "@/utils/network";
import {
  SafeAreaView,
  Pressable,
  Iconz,
  SectionTitle,
  View,
  Button,
  GradientFooter,
  IDUpload,
  Icons,
} from "@/components/ui";
import { showToast } from "@/utils/toast";

const IDSheet = ({
  isOpen,
  onDismiss,
  id,
}: {
  isOpen: boolean;
  onDismiss: () => void;
  id: ID;
}) => {
  const [localAssets, setLocalAssets] = useState<
    Record<string, PickerAsset | undefined>
  >({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );
  const [isUploading, setIsUploading] = useState(false);
  const { zostelProfile, refetchZostelProfile } = useProfile();
  const { getZostelAuthHeaders } = useAuth();

  const onSelect = (asset: PickerAsset | undefined, id: string | number) => {
    setLocalAssets((prev) => ({ ...prev, [id]: asset }));
  };

  const profileAssets = useMemo(() => {
    const result: Record<string, string | undefined> = {};
    id.pages.forEach((page) => {
      const asset = zostelProfile?.assets?.find(
        (asset) => String(asset.type) === String(page.id)
      );
      if (asset) {
        result[page.id] = asset.file;
      }
    });
    return result;
  }, [zostelProfile?.assets, id]);

  const onUpload = useCallback(() => {
    setIsUploading(true);
    const tasks = Object.entries(localAssets)
      .filter(([id, asset]) => !!asset)
      .map(([id, asset]) => {
        const formdata = new FormData();
        // @ts-ignore
        formdata.append("file", {
          uri: asset!.path,
          type: "image/jpg",
          name: `${id}-${+new Date()}.jpg`,
        });
        return axiosInstances.ZOSTEL.post(
          `/api/v1/profile/me/assets/${id}/upload/`,
          formdata,
          {
            headers: {
              ...getZostelAuthHeaders(),
              "Content-Type": "multipart/form-data",
            },
            onUploadProgress(progressEvent) {
              setUploadProgress((prev) => ({
                ...prev,
                [id]: progressEvent.progress
                  ? Number((progressEvent.progress * 100).toFixed(2))
                  : 1,
              }));
            },
          }
        ).catch(logAxiosError);
      });

    Promise.all(tasks)
      .then(() => refetchZostelProfile())
      .then(() => {
        console.log("ID uploaded successfully!");
        showToast({
          message: "ID uploaded successfully!",
          type: "success",
        });
      })
      .catch((e) => {
        logAxiosError(e);
        showToast({
          message: "Failed to upload ID!",
          type: "error",
        });
      })
      .finally(() => {
        setIsUploading(false);
        setTimeout(() => {
          setLocalAssets({});
        }, 100);
      });
  }, [localAssets, refetchZostelProfile]);

  const uploadPercent = useMemo(() => {
    if (!isUploading) return 0;
    const total = Object.values(localAssets).filter(Boolean).length;
    const values = Object.values(uploadProgress);
    return values.reduce((acc, curr) => acc + curr, 0) / total;
  }, [uploadProgress, isUploading, localAssets]);

  const titleIcon = useMemo(() => {
    return <Iconz noFill name={id.icon.toLowerCase() as Icons} size={24} />;
  }, [id]);

  const isDisabled = useMemo(() => {
    return Object.values(localAssets).every((asset) => !asset);
  }, [localAssets]);

  return (
    <Sheet hideHandle isOpen={isOpen} onDismiss={onDismiss} fullScreen>
      <SafeAreaView style={styles.container} safeArea>
        <Pressable style={styles.close} onPress={onDismiss}>
          <Iconz name="cross" size={24} fillTheme="Primary" />
        </Pressable>
        <BottomSheetScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          <SectionTitle
            content={titleIcon}
            type="Title"
            noHorizontalPadding
          >{`Upload ${id.name}`}</SectionTitle>
          <View style={styles.gap}>
            {id.pages.map((page) => (
              <IDUpload
                isLocal={!!localAssets[page.id]}
                id={String(page.id)}
                name={page.name}
                placeholder={page.sample_image}
                key={page.id}
                value={localAssets[page.id]?.path ?? profileAssets[page.id]}
                onSelect={(asset) => onSelect(asset, page.id)}
                onCross={() => onSelect(undefined, page.id)}
              />
            ))}
          </View>
        </BottomSheetScrollView>
      </SafeAreaView>
      <GradientFooter style={styles.button}>
        <Button
          isDisabled={isDisabled}
          isLoading={isUploading}
          uploadProgress={uploadPercent}
          onPress={onUpload}
        >
          Upload ID
        </Button>
      </GradientFooter>
    </Sheet>
  );
};

export default IDSheet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  close: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  gap: {
    gap: 16,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 108,
  },
  button: {
    position: "absolute",
    bottom: 0,
  },
});
