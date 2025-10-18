import { StyleSheet, View } from "react-native";
import React, { useCallback } from "react";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Sheet } from "@/components/sheets";
import { Text, Emooji, Button, SafeAreaView } from "@/components/ui";
import useMutation from "@/hooks/useMutation";
import { logAxiosError } from "@/utils/network";
import { useAuth } from "@/context/AuthContext";

interface DeleteAccountProps {
  isOpen: boolean;
  onDismiss: () => void;
}

const DeleteAccount = ({ isOpen, onDismiss }: DeleteAccountProps) => {
  const { logout } = useAuth();

  const onSuccess = useCallback(() => {
    logout();
    onDismiss();
  }, [logout]);

  const { mutate: deleteAccount, isPending } = useMutation(
    "PROFILE_SUPPORT_DELETE",
    {
      onError: logAxiosError,
      onSuccess: onSuccess,
    }
  );

  const onNo = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  const onYes = useCallback(() => {
    deleteAccount({});
  }, [deleteAccount]);

  return (
    <Sheet
      enableDynamicSizing
      maxDynamicContentSize={500}
      isOpen={isOpen}
      onDismiss={onDismiss}
    >
      <BottomSheetScrollView contentContainerStyle={styles.ph}>
        <SafeAreaView safeArea="bottom" style={styles.container}>
          <Emooji children="💀" size={48} />
          <Text type="SectionTitle" center>
            Sad to see you go!
          </Text>
          <Text center color="Secondary">
            Your account will be moved to archived state, will be permanently
            deleted after 30 days unless you login again. Are you sure about
            this?
          </Text>
          <View style={styles.buttonContainer}>
            <Button onPress={onYes} isLoading={isPending}>
              Yes
            </Button>
            <Button onPress={onNo} variant="secondary">
              No
            </Button>
          </View>
        </SafeAreaView>
      </BottomSheetScrollView>
    </Sheet>
  );
};

export default DeleteAccount;

const styles = StyleSheet.create({
  ph: {
    paddingHorizontal: 24,
  },
  container: {
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 16,
    gap: 16,
  },
  buttonContainer: {
    gap: 16,
    alignSelf: "stretch",
    marginVertical: 8,
  },
});
