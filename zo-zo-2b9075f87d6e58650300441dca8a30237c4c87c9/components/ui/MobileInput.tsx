import {
  TextInput as RnTextInput,
  StyleProp,
  TextInputProps,
  TextStyle,
  Platform,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  Keyboard,
  View,
  StyleSheet,
} from "react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import Typography from "@/config/typography.json";
import { useThemeColors } from "@/context/ThemeContext";
import useVisibilityState from "@/hooks/useVisibilityState";
import useQuery from "@/hooks/useQuery";
import { CountryCodeType } from "@/definitions/auth";
import { ListRenderItem } from "@shopify/flash-list";
import NumberSearchListItem from "./NumberSearchListItem";
import ListSearchSheet from "../sheets/ListSearch";
import Pressable from "./Pressable";
import Text from "./Text";
import Ziew from "./View";
import parsePhoneNumber from "libphonenumber-js";

export interface MobileInputProps extends TextInputProps {
  inSheet?: boolean;
  customSheetBehavior?: boolean;
  font?: keyof typeof Typography;
  translucent?: boolean;
  setIsValidNumber?: (isValid: boolean) => void;
  countryCode?: CountryCodeType;
  setCountryCode?: (countryCode: CountryCodeType) => void;
}

export const defaultCountryCode = {
  name: "India",
  flag: "🇮🇳",
  code: "IN",
  dial_code: "+91",
};

export default function MobileInput({
  font = "Paragraph",
  style,
  inSheet,
  customSheetBehavior,
  onFocus,
  onBlur,
  translucent,
  value,
  onChangeText,
  setIsValidNumber,
  countryCode = defaultCountryCode,
  setCountryCode,
  ...props
}: MobileInputProps) {
  const [
    color,
    backgroundColor,
    borderColor,
    selectionColor,
    placeholderTextColor,
    errorColor,
  ] = useThemeColors([
    "Text.Primary",
    "Background.Inputbox",
    "Stroke.Primary",
    "Icon.Primary",
    "Text.Secondary",
    "Text.Error",
  ]);

  const [_borderColor, setBorderColor] = useState<string>("transparent");

  const [isCountryListVisible, showCountryList, hideCountryList] =
    useVisibilityState();

  const [isValid, setIsValid] = useState(false);

  const { data: countryCodes } = useQuery("AUTH_APPLICATION_SEED", {
    select: (data) => data.data.mobile_country_codes,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const handlePhoneNumberChange = useCallback(
    (text: string) => {
      const number = text.replace(/[^0-9]/g, "");
      // onChangeText?.(`${countryCode.dial_code}${number}`);
      onChangeText?.(number);
    },
    [onChangeText]
  );

  const isFocused = useRef(false);
  useEffect(() => {
    const parsedNumber = parsePhoneNumber(`${countryCode?.dial_code}${value}`);
    const isValid = !!parsedNumber?.isValid();
    setIsValid(!!parsedNumber?.isValid());
    setIsValidNumber?.(isValid);
    if (!isFocused.current) {
      setBorderColor(!value || isValid ? "transparent" : errorColor);
    }
  }, [
    value,
    countryCode?.dial_code,
    setIsValidNumber,
    isFocused,
    borderColor,
    errorColor,
  ]);

  const handleCountryListShow = useCallback(() => {
    showCountryList();
    Keyboard.dismiss();
  }, []);

  const handleCountryListClose = useCallback(() => {
    hideCountryList();
  }, []);

  const handleCountryListSelect = useCallback((item: CountryCodeType) => {
    setCountryCode?.(item);
    hideCountryList();
  }, []);

  const countryItemRenderer: ListRenderItem<CountryCodeType> = useCallback(
    ({ item }) => (
      <NumberSearchListItem
        item={item}
        select={handleCountryListSelect}
        isSelected={item.dial_code === countryCode?.dial_code}
      />
    ),
    [countryCode, handleCountryListSelect]
  );

  const onFocusInput = useCallback(
    (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      isFocused.current = true;
      setBorderColor(borderColor);
      onFocus?.call(null, e);
    },
    [onFocus, borderColor]
  );

  const onBlurInput = useCallback(
    (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      isFocused.current = false;
      setBorderColor(!value || isValid ? "transparent" : errorColor);
      onBlur?.call(null, e);
    },
    [onBlur, isValid, errorColor, value]
  );

  const styles: StyleProp<TextStyle> = useMemo(
    () => [
      {
        color,
        backgroundColor,
        borderColor: _borderColor,
        borderWidth: 1,
        padding: 16,
        borderRadius: 12,
        borderCurve: "continuous",
        ...Typography[font],
        flex: 1,
      },
      Platform.OS === "ios" && font === "Paragraph" ? { lineHeight: 20 } : {},
      style,
    ],
    [style, _borderColor, font]
  );

  const finalProps: TextInputProps = useMemo(
    () => ({
      selectionColor,
      placeholderTextColor,
      onFocus: onFocusInput,
      onBlur: onBlurInput,
      style: styles,
      keyboardType: "phone-pad",
      value,
      onChangeText: handlePhoneNumberChange,
      ...props,
    }),
    [props, styles, onFocusInput, onBlurInput, handlePhoneNumberChange, value]
  );

  const Component = useMemo(
    () => (inSheet ? BottomSheetTextInput : RnTextInput),
    [inSheet]
  );

  const CustomComponent = useMemo(
    () =>
      customSheetBehavior ? (
        Platform.OS === "ios" ? (
          <BottomSheetTextInput {...finalProps} />
        ) : (
          <KeyboardAvoidingView behavior="padding">
            <RnTextInput {...finalProps} />
          </KeyboardAvoidingView>
        )
      ) : (
        <></>
      ),
    [customSheetBehavior, finalProps]
  );

  return (
    <>
      <View style={styl.container}>
        <Ziew style={styl.flagContainer} background="Inputbox">
          <Pressable onPress={handleCountryListShow} style={styl.flag}>
            <Text center>
              {countryCode?.flag} {countryCode?.dial_code}
            </Text>
          </Pressable>
        </Ziew>
        <View style={styl.inputContainer}>
          {customSheetBehavior ? (
            CustomComponent
          ) : (
            <Component {...finalProps} />
          )}
        </View>
      </View>
      {isCountryListVisible && countryCodes && (
        <ListSearchSheet
          onDismiss={handleCountryListClose}
          isOpen={isCountryListVisible}
          listData={countryCodes}
          selectedValue={countryCode ?? null}
          keyExtractor={(item) => item.code}
          onSelect={setCountryCode ?? (() => {})}
          renderItem={countryItemRenderer}
          fuseOptions={fuseOptions}
        />
      )}
    </>
  );
}

const fuseOptions = { keys: ["name", "dial_code"] };

const styl = StyleSheet.create({
  flag: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  flagContainer: {
    borderRadius: 100,
    borderCurve: "continuous",
    paddingTop: 2,
  },
  container: {
    flexDirection: "row",
    gap: 16,
  },
  inputContainer: {
    flex: 1,
  },
});
