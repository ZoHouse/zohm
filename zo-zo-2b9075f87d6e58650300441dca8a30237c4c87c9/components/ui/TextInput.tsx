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
import React, { useCallback, useMemo, useState } from "react";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import Typography from "@/config/typography.json";
import { useThemeColors } from "@/context/ThemeContext";

export interface InputProps extends TextInputProps {
  inSheet?: boolean;
  customSheetBehavior?: boolean;
  font?: keyof typeof Typography;
  translucent?: boolean;
}

export default function TextInput({
  font = "Paragraph",
  style,
  inSheet,
  customSheetBehavior,
  onFocus,
  onBlur,
  translucent,
  ...props
}: InputProps) {
  const [
    color,
    backgroundColor,
    borderColor,
    selectionColor,
    placeholderTextColor,
  ] = useThemeColors([
    "Text.Primary",
    "Background.Inputbox",
    "Stroke.Primary",
    "Icon.Primary",
    "Text.Secondary",
  ]);
  // const [borderWidth, setBorderWidth] = useState(0);
  const [_borderColor, setBorderColor] = useState<string>("transparent");

  const onFocusInput = useCallback(
    (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      // setBorderWidth(1);
      setBorderColor(borderColor);
      onFocus?.call(null, e);
    },
    [onFocus, borderColor]
  );
  const onBlurInput = useCallback(
    (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      // setBorderWidth(0);
      setBorderColor("transparent");
      onBlur?.call(null, e);
    },
    [onBlur]
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
    [style, _borderColor, font, color, backgroundColor]
  );

  const finalProps: TextInputProps = useMemo(
    () => ({
      selectionColor,
      placeholderTextColor,
      onFocus: onFocusInput,
      onBlur: onBlurInput,
      style: styles,
      ...props,
    }),
    [props, styles, onFocusInput, onBlurInput]
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
