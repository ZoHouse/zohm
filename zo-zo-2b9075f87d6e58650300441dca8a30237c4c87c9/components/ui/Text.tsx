import {
  Text as RNText,
  TextProps as RNTextProps,
  StyleProp,
  TextStyle,
} from "react-native";
import typography from "../../config/typography.json";
import { useThemeColors, TextColorType, Theme } from "@/context/ThemeContext";
import { useMemo } from "react";

export type TypographyKeys = keyof typeof typography;

interface TextProps extends RNTextProps {
  color?: TextColorType;
  type?: TypographyKeys;
  style?: StyleProp<TextStyle>;
  allowFontScaling?: boolean;
  center?: true;
  theme?: Theme;
}

const Text: React.FC<TextProps> = ({
  color: colorProp = "Primary",
  type = "Paragraph",
  style,
  allowFontScaling = false,
  center,
  theme,
  ...props
}) => {
  const [color] = useThemeColors(theme ? [theme] : [`Text.${colorProp}`]);
  const _style = useMemo(
    () => [
      typography[type],
      {
        color,
      },
      center && { textAlign: "center" },
      style,
    ],
    [color, type, style, center]
  ) as StyleProp<TextStyle>;

  return (
    <RNText allowFontScaling={allowFontScaling} style={_style} {...props} />
  );
};

export default Text;
