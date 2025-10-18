import { StyleSheet, View } from "react-native";
import Text from "./Text";

const parseMarkdown = (markdownText: string) => {
  // Split text into lines for processing
  const lines = markdownText.split("\n");

  return (
    <View>
      {lines.map((line, index) => {
        // Handle empty lines
        if (line.trim() === "") {
          return <View key={index} style={styles.emptyLine} />;
        }

        // Handle headings
        if (line.startsWith("#")) {
          const level = Math.max(
            Math.min(line.match(/^#+/)?.[0]?.length ?? 1, 1),
            3
          ) as 1 | 2 | 3;
          const text = line.replace(/^#+\s/, "");
          return (
            <Text
              type="TextHighlight"
              key={index}
              style={[styles.heading, styles[`h${level}`]]}
            >
              {text}
            </Text>
          );
        }

        // Handle lists
        if (line.trim().startsWith("- ")) {
          const text = line.trim().slice(2);
          return (
            <View key={index} style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.flex}>{parseFormattedText(text)}</Text>
            </View>
          );
        }

        // Handle regular paragraphs
        return <Text key={index}>{parseFormattedText(line)}</Text>;
      })}
    </View>
  );
};

const Markdown = ({ children }: { children: string }) => {
  return <View>{parseMarkdown(children)}</View>;
};

export default Markdown;

const styles = StyleSheet.create({
  heading: {
    marginVertical: 8,
  },
  h1: {
    fontSize: 24,
  },
  h2: {
    fontSize: 20,
  },
  h3: {
    fontSize: 18,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 4,
  },
  bullet: {
    marginRight: 8,
  },
  emptyLine: {
    height: 12,
  },
  flex: {
    flex: 1,
  },
  italic: { fontStyle: "italic" },
  strikethrough: { textDecorationLine: "line-through" },
});

function parseFormattedText(text: string) {
  // Early return for empty text
  if (!text) return [];

  // Split by markdown patterns while keeping delimiters
  const parts = text.split(/(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*)/g);

  const result: { value: string; type: string }[] = [];

  parts.forEach((part) => {
    if (!part.trim()) return; // Skip empty parts

    let type = "normal";
    let value = part;

    if (part.startsWith("***") && part.endsWith("***")) {
      value = part.slice(3, -3);
      type = "bold-italic";
    } else if (part.startsWith("**") && part.endsWith("**")) {
      value = part.slice(2, -2);
      type = "bold";
    } else if (part.startsWith("~~") && part.endsWith("~~")) {
      value = part.slice(2, -2);
      type = "strikethrough";
    } else if (part.startsWith("*") && part.endsWith("*")) {
      value = part.slice(1, -1);
      type = "italic";
    }

    // If last item has same type, combine them
    if (result.length > 0 && result[result.length - 1].type === type) {
      result[result.length - 1].value += value;
    } else {
      result.push({ value, type });
    }
  });

  return result.map((item, index) => {
    switch (item.type) {
      case "bold-italic":
        return (
          <Text type="TextHighlight" style={styles.italic} key={index}>
            {item.value}
          </Text>
        );
      case "bold":
        return (
          <Text type="TextHighlight" key={index}>
            {item.value}
          </Text>
        );
      case "italic":
        return (
          <Text style={styles.italic} key={index}>
            {item.value}
          </Text>
        );
      case "strikethrough":
        return (
          <Text style={styles.strikethrough} key={index}>
            {item.value}
          </Text>
        );
      default:
        return <Text key={index}>{item.value}</Text>;
    }
  });
}
