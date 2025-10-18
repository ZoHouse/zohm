import {
  TextInput as RnTextInput,
  StyleProp,
  TextInputProps,
  TextStyle,
  Platform,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  TextInputFocusEventData,
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
import { isValidEmail } from "@/utils/data-types/string";

export interface EmailInputProps extends TextInputProps {
  inSheet?: boolean;
  customSheetBehavior?: boolean;
  font?: keyof typeof Typography;
  translucent?: boolean;
  setIsValid?: (isValid: boolean) => void;
}

export default function EmailInput({
  font = "Paragraph",
  style,
  inSheet,
  customSheetBehavior,
  onFocus,
  onBlur,
  translucent,
  onChangeText,
  setIsValid,
  value,
  ...props
}: EmailInputProps) {
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

  //   const hasEnteredOnce = useRef(false);

  const onFocusInput = useCallback(
    (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      //   if (hasEnteredOnce.current) {
      //     setBorderColor(
      //       !value || isValidEmail(value) ? borderColor : errorColor
      //     );
      //   } else {
      //     setBorderColor(borderColor);
      //   }
      setBorderColor(borderColor);
      onFocus?.call(null, e);
    },
    [onFocus, borderColor]
  );

  const onBlurInput = useCallback(
    (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      //   hasEnteredOnce.current = true;
      //   if (!value || isValidEmail(value)) {
      //     setBorderColor("transparent");
      //   } else {
      //     setBorderColor(errorColor);
      //   }
      setBorderColor(
        !value || isValidEmail(value) ? "transparent" : errorColor
      );
      onBlur?.call(null, e);
    },
    [onBlur, value, errorColor]
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
      },
      Platform.OS === "ios" && font === "Paragraph"
        ? { lineHeight: 20 }
        : {},
      style,
    ],
    [style, _borderColor, font]
  );

  //   useEffect(() => {
  //     if (hasEnteredOnce.current) {
  //       const isValid = isValidEmail(value);
  //       console.log({ isValid, value });
  //       setBorderColor(isValid ? borderColor : errorColor);
  //     }
  //   }, [value, borderColor, errorColor]);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!setIsValid) {
      return;
    }
    setIsValid?.(false)
    const val = value;
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setIsValid?.(isValidEmail(val));
      debounceTimer.current = null;
    }, 1500);
  }, [value]);

  const handleChangeText = useCallback(
    (text: string) => {
      //   hasChangedText.current = true;
      onChangeText?.(text);
    },
    [onChangeText]
  );

  const finalProps: TextInputProps = useMemo(
    () => ({
      selectionColor,
      placeholderTextColor,
      onFocus: onFocusInput,
      onBlur: onBlurInput,
      style: styles,
      keyboardType: "email-address",
      onChangeText: handleChangeText,
      autoCapitalize: "none",
      autoCorrect: false,
      value,
      ...props,
    }),
    [props, styles, onFocusInput, onBlurInput, handleChangeText, value]
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

  return customSheetBehavior ? CustomComponent : <Component {...finalProps} />;
}
