import parsePhoneNumber from "libphonenumber-js";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import Button from "@/components/ui/Button";
import Text from "@/components/ui/Text";
import { CountryCodeType } from "@/definitions/auth";
import useMutation from "@/hooks/useMutation";
import useQuery from "@/hooks/useQuery";
import useVisibilityState from "@/hooks/useVisibilityState";
import typography from "@/config/typography.json";
import ListSearchSheet from "@/components/sheets/ListSearch";
import { ListRenderItem } from "@shopify/flash-list";
import NumberSearchListItem from "@/components/ui/NumberSearchListItem";
import Pressable from "@/components/ui/Pressable";
import { useThemeColors } from "@/context/ThemeContext";
import { logAxiosError } from "@/utils/network";

interface NumberSectionProps {
  countryCode: CountryCodeType;
  setCountryCode: (code: CountryCodeType) => void;
  phoneNumber: string;
  setPhoneNumber: (name: string) => void;
  onSubmit: () => void;
}

const fuseOptions = { keys: ["name", "dial_code"] };

const NumberSection: React.FC<NumberSectionProps> = ({
  countryCode,
  setCountryCode,
  phoneNumber,
  setPhoneNumber,
  onSubmit,
}) => {
  const inputRef = React.useRef<TextInput>(null);
  const [isValidNumber, setValidNumber] = useState<boolean>(false);
  const [isCountryListVisible, showCountryList, hideCountryList] =
    useVisibilityState();

  const { data: seed } = useQuery("AUTH_APPLICATION_SEED", {
    select: (data) => data.data,
  });

  const isWhatsAppOTPDisabled = useMemo(
    () => seed?.disabled_features?.includes("otp_whatsapp") ?? true,
    [seed]
  );

  const countryCodes = useMemo(() => seed?.mobile_country_codes ?? [], [seed]);

  const { mutateAsync, isPending } = useMutation("AUTH_LOGIN_MOBILE_OTP");

  const handleSubmit = useCallback(
    (messageChannel?: string) => {
      Keyboard.dismiss();
      mutateAsync(
        {
          mobile_country_code: countryCode.dial_code.replace("+", ""),
          mobile_number: phoneNumber,
          message_channel: messageChannel || "",
        },
        {
          onSuccess: (data) => {
            if (data.status === 200) {
              onSubmit();
            }
          },
          onError: (error) => {
            logAxiosError(error);
            inputRef.current?.focus();
          },
        }
      );
    },
    [countryCode, phoneNumber, mutateAsync, onSubmit]
  );

  const sendWhatsappOTP = useCallback(() => {
    handleSubmit("whatsapp");
  }, [handleSubmit]);

  useEffect(() => {
    const parsedNumber = parsePhoneNumber(
      `${countryCode.dial_code}${phoneNumber}`
    );

    setValidNumber((parsedNumber && parsedNumber.isValid()) || false);
  }, [phoneNumber]);

  const handlePhoneNumberChange = useCallback(
    (text: string) => {
      setPhoneNumber(text.replace(/[^0-9]/g, ""));
    },
    [setPhoneNumber]
  );

  const handleCountryListShow = useCallback(() => {
    showCountryList();
    Keyboard.dismiss();
  }, []);

  const handleCountryListClose = useCallback(() => {
    hideCountryList();
    inputRef.current?.focus();
  }, []);

  const handleCountryListSelect = useCallback((item: CountryCodeType) => {
    setCountryCode(item);
    hideCountryList();
  }, []);

  const countryItemRenderer: ListRenderItem<CountryCodeType> = useCallback(
    ({ item }) => (
      <NumberSearchListItem
        item={item}
        select={handleCountryListSelect}
        isSelected={item.dial_code === countryCode.dial_code}
      />
    ),
    [countryCode, handleCountryListSelect]
  );

  const [borderColor, textColor] = useThemeColors([
    "Stroke.Primary",
    "Text.Primary",
  ]);

  const inputStyle = useMemo(
    () => [styles.input, { color: textColor }],
    [textColor]
  );

  const countryStyle = useMemo(
    () => [styles.countryContainer, { borderColor }],
    [borderColor]
  );

  return (
    <>
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        <Animated.View
          entering={FadeIn.delay(100).duration(150)}
          style={styles.innerContainer}
        >
          <Text type="Title" color="Primary" style={styles.text}>
            What's your phone number?
          </Text>
          <View style={styles.inputContainer}>
            <Pressable style={countryStyle} onPress={handleCountryListShow}>
              <Text type="Title" color="Primary" style={styles.countryCode}>
                {countryCode.flag} {countryCode.dial_code}
              </Text>
            </Pressable>
            <TextInput
              ref={inputRef}
              keyboardType="number-pad"
              // value={phoneNumber}
              maxLength={10}
              onChangeText={handlePhoneNumberChange}
              style={inputStyle}
              selectionColor="white"
              autoFocus
            />
          </View>
        </Animated.View>
        {isValidNumber && !isWhatsAppOTPDisabled && (
          <Pressable onPress={sendWhatsappOTP}>
            <Text
              type="SubtitleHighlight"
              color="Secondary"
              style={styles.whatsappText}
            >
              Send OTP on WhatsApp
            </Text>
          </Pressable>
        )}
        <View style={styles.foot}>
          {isValidNumber ? (
            <Button isLoading={isPending} onPress={handleSubmit}>
              Send OTP
            </Button>
          ) : (
            <Text type="Subtitle" color="Secondary">
              By proceeding, I consent to Zo World vibing with me over Phone 🤙.
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
      {isCountryListVisible && (
        <ListSearchSheet
          onDismiss={handleCountryListClose}
          isOpen={isCountryListVisible}
          listData={countryCodes}
          selectedValue={countryCode}
          keyExtractor={(item) => item.code}
          onSelect={setCountryCode}
          renderItem={countryItemRenderer}
          fuseOptions={fuseOptions}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, alignItems: "center", paddingTop: 80 },
  innerContainer: { alignItems: "center", flex: 1 },
  text: {
    textAlign: "center",
    width: 286,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginVertical: 40,
  },
  countryContainer: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 12,
    borderRadius: 100,
    borderCurve: "continuous",
    borderStyle: "dashed",
    borderWidth: 2,
    flexDirection: "row",
    // ...sharedStyles.wStroke,
  },
  countryCode: {
    textAlign: "center",
  },
  input: {
    paddingLeft: 16,
    flexShrink: 0,
    flex: 1,
    ...typography.Title,
    lineHeight: undefined,
  },
  whatsappText: {
    paddingBottom: 16,
  },
  foot: { width: "100%", marginBottom: 8 },
});

export default NumberSection;
