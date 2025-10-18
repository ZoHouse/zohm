import { View, StyleSheet, Keyboard } from "react-native";
import React, { useCallback, useMemo, useState } from "react";
import { ActionsSheet, Sheet } from "@/components/sheets";
import helpers from "@/utils/styles/helpers";
import useProfile from "@/hooks/useProfile";
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useThemeColors } from "@/context/ThemeContext";
import useMutation from "@/hooks/useMutation";
import { logAxiosError } from "@/utils/network";
import {
  SafeAreaView,
  Pressable,
  Iconz,
  Text,
  SectionTitle,
  TextInput,
  Button,
  EmailInput,
  Divider,
  Loader,
} from "@/components/ui";
import { triggerNotification } from "@/utils/haptics";
import { showToast } from "@/utils/toast";
import useQuery from "@/hooks/useQuery";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { MergeResponse, ZoUserEmail } from "@/definitions/auth";
import useVisibilityState from "@/hooks/useVisibilityState";
import MergeAccountsSheet from "../MergeAccounts";

interface ConnectEmailProps {
  isOpen: boolean;
  onDismiss: () => void;
}

const ConnectEmail = ({ isOpen, onDismiss }: ConnectEmailProps) => {
  const { refetchProfile } = useProfile();
  const [email, setEmail] = useState("");
  const [otp, setOTP] = useState("");
  const [otpBorder, setOtpBorder] = useState<string | null>(null);
  const [otpSent, showOtp, hideOtp] = useVisibilityState(false);
  const translation = useSharedValue(0);
  const [mergeResponse, setMergeResponse] = useState<MergeResponse | null>(
    null
  );

  const { mutate: requestAddOTP, isPending: isLoadingAddOTP } = useMutation(
    "AUTH_REQUEST_OTP_EMAIL"
  );
  const { mutate: addEmail, isPending: isLoadingAdd } =
    useMutation("AUTH_USER_EMAILS");

  const {
    data: emails,
    isLoading: isLoadingEmails,
    refetch: refetchEmails,
  } = useQuery("AUTH_USER_EMAILS", {
    select: (data) => data.data.emails,
    throwOnError: (er) => {
      logAxiosError(er);
      return false;
    },
  });

  const handleOTPChange = useCallback((text: string) => {
    const cleanedText: string = text.replace(/[^0-9]/g, "");
    if (cleanedText.length <= 6) {
      const formattedText =
        cleanedText.length > 3
          ? `${cleanedText.slice(0, 3)}-${cleanedText.slice(3)}`
          : cleanedText;
      setOTP(formattedText);
    }
  }, []);

  const [red, green] = useThemeColors(["Vibes.Red", "Vibes.Green"]);

  const onUpdateEmail = useCallback(
    (deleted?: boolean) => {
      if (deleted) {
        showToast({ message: "Email deleted successfully", type: "success" });
      } else {
        showToast({ message: "Email updated successfully", type: "success" });
      }
      refetchEmails();
      refetchProfile();
      onDismiss();
    },
    [refetchEmails, refetchProfile, onDismiss]
  );

  const close = useCallback(() => {
    showToast({ message: "Email added successfully", type: "success" });
    onDismiss();
  }, [onDismiss]);

  const sendVerificationCode = useCallback(() => {
    if (!email) return;
    requestAddOTP(
      {
        email_address: email,
      },
      {
        onSuccess: () => {
          showOtp();
        },
        onError: (er) => {
          logAxiosError(er);
          showToast({ message: "Something went wrong", type: "error" });
          onDismiss();
        },
      }
    );
  }, [email]);

  const sendOtp = useCallback(() => {
    if (!email || !otp) return;
    const data = {
      email_address: email,
      otp: otp.replace(/-/g, ""),
      verification_type: "native-email",
    };
    addEmail(data, {
      onSuccess: () => {
        setOtpBorder(green);
        close();
      },
      onError: (error) => {
        logAxiosError(error);
        if (error?.response?.status === 409) {
          Keyboard.dismiss();
          setMergeResponse(errorToMergeResponse(error, data));
        } else {
          setOtpBorder(red);
          triggerNotification("Error");
          translation.value = withRepeat(
            withTiming(10, { duration: 50 }),
            6,
            true,
            () => {
              translation.value = 0;
              runOnJS(setOtpBorder)(null);
              runOnJS(setOTP)("");
            }
          );
        }
      },
    });
  }, [email, otp, close]);

  const otpInputStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translation.value }],
    };
  });

  const otpTextInputStyle = useMemo(
    () => [styles.textinput, otpBorder && { borderColor: otpBorder }],
    [otpBorder]
  );

  const [emailIsValid, setEmailIsValid] = useState(false);

  return (
    <Sheet
      isOpen={isOpen}
      onDismiss={onDismiss}
      snapPoints={["60%"]}
      keyboardBlurBehavior="restore"
    >
      <SafeAreaView safeArea="bottom" style={styles.container}>
        {otpSent ? (
          <>
            <View style={styles.head}>
              <Pressable onPress={hideOtp}>
                <Iconz size={24} name="arrow-left" />
              </Pressable>
              <Text type="SectionTitle" style={helpers.flex}>
                {`Enter OTP sent on ${email ? email : "your email"}`}
              </Text>
            </View>
            <Animated.View style={otpInputStyle}>
              <TextInput
                autoFocus
                value={otp}
                onChangeText={handleOTPChange}
                keyboardType="number-pad"
                autoCapitalize="none"
                placeholder="000-000"
                style={otpTextInputStyle}
                inSheet
              />
            </Animated.View>
            <View style={helpers.flex} />
            <Button
              isDisabled={otp.length !== 7}
              onPress={sendOtp}
              isLoading={isLoadingAdd}
            >
              Zo Zo Zo! Verify
            </Button>
          </>
        ) : (
          <>
            <SectionTitle noHorizontalPadding>Your Email</SectionTitle>
            <Animated.View style={styles.emailContainer}>
              <EmailInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                placeholder="Type here..."
                style={styles.textinput}
                inSheet
                setIsValid={setEmailIsValid}
              />
              {isLoadingEmails ? (
                <Animated.View
                  style={styles.loader}
                  key="loader"
                  entering={FadeIn}
                  exiting={FadeOut}
                >
                  <Loader />
                </Animated.View>
              ) : emails?.length ? (
                <Animated.View
                  key="list"
                  style={styles.emailListContainer}
                  entering={FadeIn}
                  exiting={FadeOut}
                >
                  <Divider />
                  <BottomSheetFlatList
                    data={emails}
                    style={styles.list}
                    contentContainerStyle={styles.emailList}
                    renderItem={({ item }) => (
                      <EmailRowItem
                        key={item.email_address}
                        email={item}
                        onUpdate={onUpdateEmail}
                      />
                    )}
                  />
                </Animated.View>
              ) : null}
            </Animated.View>
            {emailIsValid ? (
              <Animated.View key="button" entering={FadeIn} exiting={FadeOut}>
                <Button
                  onPress={sendVerificationCode}
                  isLoading={isLoadingAddOTP}
                >
                  Send Verification Code
                </Button>
              </Animated.View>
            ) : null}
          </>
        )}
      </SafeAreaView>
      {mergeResponse ? (
        <MergeAccountsSheet
          isOpen={!!mergeResponse}
          mergeResponse={mergeResponse}
          onDismiss={() => setMergeResponse(null)}
          onSuccess={onDismiss}
        />
      ) : null}
    </Sheet>
  );
};

export default ConnectEmail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  textinput: {
    lineHeight: 20,
    marginVertical: 8,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 12,
    marginVertical: 12,
  },
  emailContainer: {
    flex: 1,
    gap: 8,
  },
  list: {
    flex: 1,
    marginTop: -8,
  },
  emailList: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  emailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 42,
  },
  emailRowIcons: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  flex: {
    flex: 1,
  },
  emailListContainer: {
    gap: 8,
    flex: 1,
  },
  loader: {
    marginTop: 16,
  },
});

const EmailRowItem = ({
  email,
  onUpdate,
}: {
  email: ZoUserEmail;
  onUpdate: (deleted?: boolean) => void;
}) => {
  const [isActionMenuOpen, showActionMenu, hideActionMenu] =
    useVisibilityState(false);

  const { mutateAsync: updateEmail } = useMutation("AUTH_USER_EMAILS_UPDATE");
  const { mutateAsync: deleteEmail } = useMutation("AUTH_USER_EMAILS_DELETE");

  const handleMakePrimary = useCallback(() => {
    updateEmail({
      email_address: email.email_address,
      primary: true,
    })
      .then(() => onUpdate())
      .catch((er) => {
        logAxiosError(er);
        showToast({ message: "Something went wrong", type: "error" });
      });
  }, [email.email_address]);

  const handleRemove = useCallback(() => {
    deleteEmail({
      data: { email_address: email.email_address },
    })
      .then(() => onUpdate(true))
      .catch((er) => {
        logAxiosError(er);
        showToast({ message: "Something went wrong", type: "error" });
      });
  }, [email.email_address]);

  const menuItems = useMemo(
    () => [
      {
        title: "Make Primary",
        onPress: handleMakePrimary,
        id: "make-primary",
        emoji: "✅",
      },
      {
        title: "Remove",
        onPress: handleRemove,
        id: "delete",
        emoji: "❌",
      },
    ],
    [handleMakePrimary, handleRemove]
  );

  return (
    <Pressable
      activeOpacity={0.8}
      onPress={showActionMenu}
      style={styles.emailRow}
    >
      <Text style={styles.flex} type="Subtitle">
        {email.email_address}
      </Text>
      <View style={styles.emailRowIcons}>
        {email.primary ? (
          <Iconz name="check-circle" size={16} fillTheme="Primary" />
        ) : null}
        <Iconz name="more" size={20} fillTheme="Primary" />
      </View>
      <ActionsSheet
        isOpen={isActionMenuOpen}
        onDismiss={hideActionMenu}
        items={menuItems}
      />
    </Pressable>
  );
};

const errorToMergeResponse = (
  error: any,
  auth: MergeResponse["auth"]
): MergeResponse => {
  return {
    merge_id: error.response.data?.merge_id ?? "",
    pid: error.response.data?.merge_with?.pid ?? "",
    membership: error.response.data?.merge_with?.membership ?? "",
    ens_nickname: error.response.data?.merge_with?.ens_nickname ?? "",
    custom_nickname: error.response.data?.merge_with?.custom_nickname ?? "",
    nickname: error.response.data?.merge_with?.nickname ?? "",
    wallet_address: error.response.data?.merge_with?.wallet_address ?? "",
    email_address: error.response.data?.merge_with?.email_address ?? "",
    mobile_number: error.response.data?.merge_with?.mobile_number ?? "",
    pfp_image: error.response.data?.merge_with?.pfp_image ?? "",
    created_at: error.response.data?.merge_with?.created_at ?? "",
    auth,
  };
};
