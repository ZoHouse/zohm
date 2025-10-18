import React, { memo, useCallback, useMemo } from "react";
import { StyleProp, StyleSheet, Text, ViewStyle } from "react-native";
import Typography from "@/config/typography.json";
import { useThemeColors } from "@/context/ThemeContext";
import Pressable from "./Pressable";

interface SmallButtonProps {
  onPress?: () => void;
  children: string | string[];
  type?: "primary" | "secondary" | "fancy";
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  textStyle?: keyof typeof Typography;
  extraSmall?: boolean;
}

const SmallButton: React.FC<SmallButtonProps> = ({
  children,
  type = "primary",
  extraSmall = false,
  onPress,
  style,
  textStyle = "TextHighlight",
  disabled = false,
}) => {
  const [buttonP, textP, buttonS, textS, disabledColor, disabledText, buttonF, strokeF] =
    useThemeColors([
      "Button.Secondary",
      "Text.Button",
      "Background.Inputbox",
      "Text.Primary",
      "Button.SecondaryDisabled",
      "Text.SecondaryButtonDisabled",
      "Background.Primary",
      "Brand.Zostel"
    ]);

  const backgroundColor = type === "primary" ? buttonP : type === "secondary" ? buttonS : buttonF;
  const color = type === "primary" ? textP : textS;
  const borderColor = type === "fancy" ? strokeF : undefined;

  const handlePress = useCallback(() => {
    onPress?.();
  }, [onPress]);

  const _style = useMemo(
    () => [
      styles.emptyStateButton,
      {
        backgroundColor,
        paddingHorizontal: extraSmall ? 12 : 16,
        paddingVertical: extraSmall ? 8 : 8,
      },
      borderColor ? { borderColor, borderWidth: 2 } : {},
      style,
      disabled ? { backgroundColor: disabledColor } : {},
    ],
    [backgroundColor, style, disabled, disabledColor, extraSmall, borderColor]
  );

  const _textStyle = useMemo(
    () => [
      styles.emptyStateButtonText,
      { color },
      Typography[textStyle],
      disabled ? { color: disabledText } : {},
    ],
    [color, textStyle, disabled, disabledText]
  );

  return (
    <Pressable disabled={disabled} style={_style} onPress={handlePress}>
      <Text style={_textStyle}>{children}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  emptyStateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    borderCurve: "continuous",
  },
  emptyStateButtonText: {
    ...Typography.TextHighlight,
    textAlign: "center",
  },
});

export default memo(SmallButton);
