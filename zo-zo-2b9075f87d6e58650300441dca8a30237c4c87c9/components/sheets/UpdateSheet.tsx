import { Linking, StyleSheet, View } from "react-native";
import { Button, SafeAreaView, SmallButton, Text } from "../ui";
import Sheet from "./Base";
import { useCallback } from "react";
import { BottomSheetView } from "@gorhom/bottom-sheet";


interface UpdateSheetProps {
  isOpen: boolean;
  onDismiss: () => void;
  updateData: {
    force_update: boolean;
    soft_update: boolean;
    message: string;
    url: string;
  };
}

const UpdateSheet = ({
  isOpen,
  onDismiss,
  updateData,
}: UpdateSheetProps) => {

  const handlePress = useCallback(() => {
    Linking.openURL(updateData.url);
  }, [updateData.url]);

  return (
    <Sheet
      isOpen={isOpen}
      onDismiss={onDismiss}
      disableBackdropPress={updateData.force_update}
      enableHandlePanningGesture={!updateData.force_update}
      enableContentPanningGesture={!updateData.force_update}
      enablePanDownToClose={!updateData.force_update}
      enableDynamicSizing
      maxDynamicContentSize={600}
    >
      <BottomSheetView>
        <SafeAreaView safeArea="bottom" style={styles.container}>
          <View>
            <Text type="Title" center style={styles.head}>
              Update Available
            </Text>
            <Text type="SubtitleHighlight" color="Secondary" center>
              Mandatory
            </Text>
          </View>
          <View style={styles.body}>
            <Text
              center
              numberOfLines={3}
              type="Subtitle"
            >{`${updateData.message}`}</Text>
            <Button onPress={handlePress} style={styles.button}>
              Update
            </Button>
            {updateData.soft_update && (
              <SmallButton
                style={styles.laterButton}
                type="secondary"
                onPress={onDismiss}
              >
                Remind me later
              </SmallButton>
            )}
          </View>
        </SafeAreaView>
      </BottomSheetView>
    </Sheet>
  );
};

export default UpdateSheet;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
  },
  head: {
    paddingVertical: 16,
  },
  body: {
    paddingVertical: 12,
    gap: 8,
  },
  button: {
    marginVertical: 8,
  },
  laterButton: {
    paddingVertical: 16,
    marginBottom: 16,
    alignSelf: "center",
  },
});