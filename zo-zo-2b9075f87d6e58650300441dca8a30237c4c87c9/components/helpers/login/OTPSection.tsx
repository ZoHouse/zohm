import { CountryCodeType } from "@/definitions/auth";
import useMutation from "@/hooks/useMutation";
import useQuery from "@/hooks/useQuery";
import OTPInputView from "@twotalltotems/react-native-otp-input";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, KeyboardAvoidingView, StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { logAxiosError } from "@/utils/network";
import Button from "@/components/ui/Button";
import { useThemeColors } from "@/context/ThemeContext";
import Text from "@/components/ui/Text";
import typography from "@/config/typography.json";
import { useAuth } from "@/context/AuthContext";
import ResendOTP from "./ResendOTP";
import Pressable from "@/components/ui/Pressable";
import { Iconz } from "@/components/ui";
import device from "@/config/Device";

interface OTPSectionProps {
  countryCode: CountryCodeType;
  phoneNumber: string;
  onBack: () => void;
  onSuccess: () => void;
}

const OTPSection: React.FC<OTPSectionProps> = ({
  countryCode,
  phoneNumber,
  onBack,
  onSuccess,
}) => {
  const [otp, setOtp] = useState<string>("");
  const translation = useSharedValue(0);
  const invalidOTPs = useRef<string[]>([]);
  const otpRef = useRef<any>(null);

  const { loginZoZo } = useAuth();
  const { mutateAsync: requestOTP, isPending: isResendOTP } = useMutation(
    "AUTH_LOGIN_MOBILE_OTP"
  );
  const { data: isWhatsAppOTPDisabled } = useQuery("AUTH_APPLICATION_SEED", {
    select: (data) => data.data.disabled_features.includes("otp_whatsapp"),
  });

  const [isLoading, setLoading] = useState<boolean>(false);

  const otpInputStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translation.value }],
    };
  });

  const focusOtp = useCallback(() => {
    setTimeout(() => otpRef.current?.focusField(0), 1000);
  }, []);

  useEffect(() => {
    focusOtp();
  }, []);

  const resendOTP = (messageChannel?: string) => {
    requestOTP(
      {
        mobile_country_code: countryCode.dial_code.replace("+", ""),
        mobile_number: phoneNumber,
        message_channel: messageChannel || "",
      },
      {
        onError: logAxiosError,
      }
    );
  };

  const onInvalidOTP = useCallback((error: any, otp: string) => {
    logAxiosError(error);
    invalidOTPs.current.push(otp);
    // triggerHaptic("notificationError");
    translation.value = withRepeat(
      withTiming(10, { duration: 50 }),
      6,
      true,
      () => {
        translation.value = 0;
        runOnJS(setOtp)("");
        runOnJS(focusOtp)();
      }
    );
    setLoading(false);
  }, []);

  const handleSubmit = (_code?: string) => {
    const _otp = _code || otp;
    if (!invalidOTPs.current.includes(_otp)) {
      setLoading(true);
      loginZoZo(countryCode.dial_code.replace("+", ""), phoneNumber, _otp)
        .then((data) => {
          if (data) {
            onSuccess();
          }
        })
        .catch((er) => {
          logAxiosError(er);
          if (er.message === "INVALID_OTP") {
            onInvalidOTP(er, _otp);
          }
        })
        .finally(() => setLoading(false));
    }
  };

  const handleCodeFilled = useCallback(
    (code: string) => {
      if (!invalidOTPs.current.includes(code)) {
        Keyboard.dismiss();
        handleSubmit(code);
      }
    },
    [handleSubmit]
  );

  const handleBack = useCallback(() => {
    setOtp("");
    onBack();
  }, [onBack, setOtp]);

  const [inputColor] = useThemeColors(["Text.Primary"]);

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <Pressable style={styles.backButton} onPress={handleBack}>
        <Iconz name="arrow-left" size={24} fillTheme="Primary" />
      </Pressable>
      <Animated.View
        entering={FadeIn.delay(100).duration(150)}
        style={styles.innerContainer}
      >
        <Text type="Title" style={styles.text}>
          Enter the OTP sent on
        </Text>
        <Text type="Title" style={styles.text}>
          {countryCode.dial_code} {phoneNumber}
        </Text>
        <Animated.View style={otpInputStyle}>
          <OTPInputView
            style={styles.otp}
            pinCount={6}
            // code={otp}
            ref={otpRef}
            onCodeFilled={handleCodeFilled}
            onCodeChanged={setOtp}
            placeholderCharacter="•"
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            autoFocusOnLoad={false}
            selectionColor={inputColor}
            codeInputFieldStyle={device.isAndroid ? styles.otpInputAndroid : styles.otpInput}
          />
        </Animated.View>
        <View style={styles.flex} />
      </Animated.View>
      <View style={styles.lowerContainer}>
        <ResendOTP
          onPress={resendOTP}
          isLoading={isResendOTP}
          isWhatsAppOTPDisabled={isWhatsAppOTPDisabled}
        />
        <View style={styles.buttonContainer}>
          {otp.length === 6 && (
            <Button isLoading={isLoading} onPress={handleSubmit}>
              Verify
            </Button>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    paddingTop: 80,
    position: "relative",
  },
  innerContainer: { alignItems: "center", flex: 1 },
  text: {
    textAlign: "center",
  },
  otp: {
    height: 56,
    marginVertical: 40,
    width: "80%",
  },
  otpInput: {
    borderColor: "transparent",
    ...typography.Title,
    includeFontPadding: false,
  },
  otpInputAndroid: {
    borderColor: "transparent",
    fontFamily: typography.Title.fontFamily,
    fontSize: typography.Title.fontSize,
    includeFontPadding: false,
  },
  flex: {
    flex: 1,
  },
  lowerContainer: {
    flexShrink: 0,
    gap: 40,
    width: "100%",
    alignItems: "center",
  },
  buttonContainer: {
    // paddingBottom: 8,
    width: "100%",
  },
  backButton: { position: "absolute", left: 24, top: 8 },
});

export default OTPSection;
