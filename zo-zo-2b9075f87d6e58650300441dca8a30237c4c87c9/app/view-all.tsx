import React, { useCallback } from "react";
import SafeAreaView from "@/components/ui/SafeAreaView";
import { StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import Text from "@/components/ui/Text";
import Iconz from "@/components/ui/Iconz";
import Pressable from "@/components/ui/Pressable";
import { useRouter } from "expo-router";

export default function () {
  const router = useRouter();
  const data: number[] = [];
  const goBack = useCallback(() => router.dismiss(), [router]);
  const renderItem = () => <></>;

  return (
    <SafeAreaView safeArea="top" style={styles.screen}>
      <View style={styles.head}>
        <Pressable onPress={goBack}>
          <Iconz name="arrow-left" size={24} />
        </Pressable>
      </View>
      <View style={styles.info}>
        {/* Logo */}
        <Text center>
          Vibrant stays for solo travellers and group of friends in
          awe-inspiring locations
        </Text>
      </View>
      <FlashList numColumns={2} data={data} renderItem={renderItem} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  head: {
    height: 56,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingHorizontal: 24,
  },
  info: {
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 24,
  },
});
