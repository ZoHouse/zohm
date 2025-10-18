import device from "@/config/Device";
import RenderHtml from "react-native-render-html";
import { TypographyKeys } from "./Text";
import Typography from "@/config/typography.json";
import { useMemo } from "react";
import { TextColorType, useThemeColors } from "@/context/ThemeContext";

interface RenderHTMLTextProps {
  html: string;
  type?: TypographyKeys;
  color?: TextColorType;
}

const w = device.WINDOW_WIDTH;

const RenderHTMLText = ({
  html,
  type = "Paragraph",
  color = "Primary",
}: RenderHTMLTextProps) => {
  const [textColor] = useThemeColors([`Text.${color}`]);

  const textStyle = useMemo(() => {
    return {
      ...Typography[type],
      fontWeight: getFontWeight(type),
      color: textColor,
    };
  }, [type, textColor]);

  const source = useMemo(
    () => ({
      html,
    }),
    [html]
  );

  return (
    <RenderHtml
      contentWidth={w - 48}
      source={source}
      baseStyle={textStyle}
      tagsStyles={tagStyles}
    />
  );
};

const tagStyles = {
  strong: {
    fontFamily: "Rubik-Medium",
    fontWeight: "bold",
  },
  em: {
    fontStyle: "italic",
  },
  p: {
    // marginBottom: 16,
  },
  li: {
    marginBottom: 8,
    marginLeft: 8
  }
} as const;

export default RenderHTMLText;

const getFontWeight: (type: TypographyKeys) => "bold" | "normal" = (type) => {
  switch (type) {
    case "Title":
    case "SectionTitle":
    case "SubtitleHighlight":
    case "TertiaryHighlight":
    case "TextHighlight":
    case "BigButton":
    case "SmallButton":
    case "MiniFocus":
      return "bold";
    default:
      return "normal";
  }
};
