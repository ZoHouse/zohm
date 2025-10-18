import Iconz from "@/components/ui/Iconz";
import Pressable from "@/components/ui/Pressable";
import Text from "@/components/ui/Text";
import { useThemeColors } from "@/context/ThemeContext";
import { memo, useCallback } from "react";
import { View, StyleSheet } from "react-native";

const Counter = memo(
  ({
    count,
    setCount,
    max,
    min = 1,
  }: {
    count: number;
    setCount: (count: number, action: "I" | "D") => void;
    max?: number;
    min?: number;
  }) => {
    const [bg, icon, bgDisabled, iconDisabled] = useThemeColors([
      "Button.Secondary",
      "Text.SecondaryButton",
      "Button.SecondaryDisabled",
      "Text.SecondaryButtonDisabled",
    ]);

    const increase = useCallback(() => {
      if (!max) {
        setCount(count + 1, "I");
      } else if (count < max) {
        setCount(count + 1, "I");
      }
    }, [count, max, setCount]);

    const decrease = useCallback(() => {
      if (count > min) {
        setCount(count - 1, "D");
      }
    }, [count, setCount, min]);

    const minusButton = (
      <Pressable
        onPress={decrease}
        disabled={count === min}
        style={[
          styles.button,
          { backgroundColor: count === min ? bgDisabled : bg },
        ]}
      >
        <Iconz
          name="minus"
          fill={count === min ? iconDisabled : icon}
          size={16}
        />
      </Pressable>
    );

    const plusButton = (
      <Pressable
        disabled={count === max}
        onPress={increase}
        style={[
          styles.button,
          { backgroundColor: count === max ? bgDisabled : bg },
        ]}
      >
        <Iconz
          name="plus"
          fill={count === max ? iconDisabled : icon}
          size={16}
        />
      </Pressable>
    );

    return (
      <View style={styles.container}>
        {minusButton}
        <Text type="SubtitleHighlight">{count}</Text>
        {plusButton}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    height: 40,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    width: 30,
    height: 30,
    borderRadius: 30,
  },
});

export default Counter;
