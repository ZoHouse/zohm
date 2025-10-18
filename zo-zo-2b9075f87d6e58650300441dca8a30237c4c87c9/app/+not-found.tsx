import { View } from "@/components/ui";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet } from "react-native";

export default function NotFoundScreen() {
  useEffect(() => {
    router.back();
  }, []);
  return (
    <View background="Zostel" style={styles.screen}>
      <Image source={require("@/assets/images/icon.png")} style={styles.icon} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
    padding: 24,
  },
  icon: {
    width: 48,
    height: 48,
  },
});
