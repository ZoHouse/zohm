import React, { useCallback, useEffect, useState } from "react";
import { Platform, StyleSheet } from "react-native";
import Text from "@/components/ui/Text";
import View from "@/components/ui/View";
import Pressable from "@/components/ui/Pressable";
import { Iconz } from "@/components/ui";

interface ResendOTPProps {
  onPress: (messageChannel?: string) => void;
  isLoading: boolean;
  isWhatsAppOTPDisabled?: boolean;
}

const ResendOTP: React.FC<ResendOTPProps> = ({
  onPress,
  isLoading,
  isWhatsAppOTPDisabled,
}) => {
  const [seconds, setSeconds] = useState<number>(30);
  const [isVisible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    setTimeout(() => {
      setVisible(true);
    }, 5000);
  }, []);

  const handleResend = useCallback(() => {
    setSeconds(30);
    onPress();
  }, [onPress]);

  const handleWhatsAppResend = useCallback(() => {
    setSeconds(30);
    onPress("whatsapp");
  }, [onPress]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(seconds - 1);
    }, 1000);
    if (seconds === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [seconds]);

  return isLoading ? (
    <Text type="BigButton" color="Secondary">
      Sending OTP ...
    </Text>
  ) : isVisible ? (
    seconds === 0 ? (
      <View style={styles.container}>
        <Text type="TextHighlight">Resend OTP on</Text>
        <View style={styles.actionsContainer}>
          <Pressable onPress={handleResend}>
            <View style={styles.action} background="Card">
              <Iconz name="chat" size={18} fillTheme="Primary" />
              <Text type="BigButton" style={styles.actionText}>
                SMS
              </Text>
            </View>
          </Pressable>
          {!isWhatsAppOTPDisabled && (
            <Pressable onPress={handleWhatsAppResend}>
              <View style={styles.action} background="Card">
                <Iconz name="whatsapp" size={18} fillTheme="Primary" />
                <Text type="BigButton" style={styles.actionText}>
                  WhatsApp
                </Text>
              </View>
            </Pressable>
          )}
        </View>
      </View>
    ) : (
      <Text type="BigButton" color="Secondary">
        Resend OTP in {seconds} seconds
      </Text>
    )
  ) : (
    <></>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 16,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 24,
  },
  action: {
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  actionText: {
    lineHeight: Platform.select({ ios: 0 }),
  },
});

export default ResendOTP;
