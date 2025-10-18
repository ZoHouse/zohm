import { StyleSheet } from "react-native";
import React, { memo, useCallback } from "react";
import Animated, { FadeInRight } from "react-native-reanimated";
import { router } from "expo-router";
import useQuery from "@/hooks/useQuery";
import { logAxiosError } from "@/utils/network";
import { Iconz, Pressable } from "@/components/ui";

const ChatIcon = () => {
  const { data: hasAccess } = useQuery("COMMS_THREADS", {
    select: (data) => !!data.data.results.length,
    throwOnError: (er) => {
      return false;
    },
  });

  const handlePress = useCallback(() => {
    router.push("/chat/all");
  }, []);

  if (!hasAccess) {
    return null;
  }

  return (
    <Animated.View style={styles.box} entering={FadeInRight}>
      <Pressable
        activeOpacity={0.8}
        onPress={handlePress}
        style={styles.container}
      >
        <Iconz name="chat" size={24} fillTheme="Primary" />
      </Pressable>
    </Animated.View>
  );
};

export default memo(ChatIcon);

const styles = StyleSheet.create({
  box: {
    marginRight: -8,
  },
  container: {
    paddingHorizontal: 8,
  },
});
