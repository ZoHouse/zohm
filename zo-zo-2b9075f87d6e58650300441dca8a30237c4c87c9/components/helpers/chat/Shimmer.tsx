import { AnimatedShimmer, SafeAreaView } from "@/components/ui";
import { memo } from "react";
import { StyleSheet, View } from "react-native";

const ChatRowShimmer = () => {
  return (
    <View style={styles.row}>
      <View style={styles.image}>
        <AnimatedShimmer />
      </View>
      <View style={styles.flex}>
        <AnimatedShimmer />
      </View>
    </View>
  );
};

const list = Array.from({ length: 10 }, (_, index) => index);

export const ChatListShimmer = memo(() => {
  return (
    <View style={styles.container}>
      <SafeAreaView safeArea="top" />
      <View style={styles.head} />
      <View style={styles.rows}>
        {list.map((item) => (
          <ChatRowShimmer key={item} />
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    marginTop: 16,
  },
  title: { width: 200, height: 42, marginBottom: 16 },
  rows: { gap: 12, marginTop: 12, flex: 1 },
  row: { width: "100%", height: 72, flexDirection: "row", gap: 12 },
  flex: { flex: 1 },
  image: { width: 56, height: 56, borderRadius: 100, overflow: "hidden" },
  head: {
    height: 56,
  },
});
