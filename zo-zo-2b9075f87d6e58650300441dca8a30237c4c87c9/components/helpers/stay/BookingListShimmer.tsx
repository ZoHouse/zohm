import { AnimatedShimmer } from "@/components/ui";
import { memo } from "react";
import { StyleSheet, View } from "react-native";

const BookingRowShimmer = () => {
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

const BookingListShimmer = () => {
  return (
    <View style={styles.container}>
      <View style={styles.title}>
        <AnimatedShimmer />
      </View>
      <View style={styles.rows}>
        {list.map((item) => (
          <BookingRowShimmer key={item} />
        ))}
      </View>
    </View>
  );
};

export default memo(BookingListShimmer);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    marginTop: 16,
  },
  title: { width: 200, height: 42, marginBottom: 16 },
  rows: { gap: 12, marginTop: 12, flex: 1 },
  row: { width: "100%", height: 72, flexDirection: "row", gap: 12 },
  flex: { flex: 1 },
  image: { width: 40, height: 40, borderRadius: 100, overflow: "hidden" },
});
