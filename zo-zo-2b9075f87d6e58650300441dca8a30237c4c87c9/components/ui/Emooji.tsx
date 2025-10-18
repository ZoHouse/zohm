import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

interface EmoojiProps {
  children: string;
  size: number;
}

const Emooji: React.FC<EmoojiProps> = ({ children, size }) => {
  const style = useMemo(
    () => ({
      color: "#000",
      fontSize: Platform.select({ ios: size, android: size * 0.8 }),
      lineHeight:
        1.1 * (Platform.select({ ios: size, android: size * 0.8 }) || size),
      alignItems: "center" as const,
    }),
    [size]
  );

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text allowFontScaling={false} style={style}>
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexShrink: 0,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
  },
});

export default Emooji;
