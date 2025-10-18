import device from "@/config/Device";
import RenderHtml from "react-native-render-html";
import { TypographyKeys } from "./Text";
import Typography from "@/config/typography.json";
import { useMemo } from "react";
import { TextColorType, useThemeColors } from "@/context/ThemeContext";

interface RenderHTMLBlogProps {
  html: string;
  type?: TypographyKeys;
  color?: TextColorType;
}

const w = device.WINDOW_WIDTH;

const RenderHTMLBlog = ({
  html,
  type = "Paragraph",
  color = "Primary",
}: RenderHTMLBlogProps) => {
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
      html: html.replace(/^\s+|<br\s*\/?>|\s+\r?\n|\r+$/gm, ""),
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
  h1: {
    fontSize: 20,
    fontFamily: "Rubik-Medium",
    fontWeight: "bold",
    marginVertical: 16,
  },
  h2: {
    fontSize: 18,
    fontFamily: "Rubik-Medium",
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 12,
  },
  li: {
    marginBottom: 8,
  },
  p: {
    marginVertical: 4,
  },
  em: {
    fontStyle: "italic",
  },
  img: {
    marginTop: 16,
    marginBottom: 8,
  },
  pre: {
    fontFamily: "Rubik-Regular",
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 8,
  },
  a: {
    color: "#F1563F",
    fontFamily: "Rubik-Medium",
    fontWeight: "bold",
  },
} as const;

export default RenderHTMLBlog;

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
