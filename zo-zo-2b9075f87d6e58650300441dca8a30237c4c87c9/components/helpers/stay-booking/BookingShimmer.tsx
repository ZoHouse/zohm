import { View, Text, StyleSheet } from "react-native";
import React, { memo } from "react";
import helpers from "@/utils/styles/helpers";
import { AnimatedShimmer } from "@/components/ui";

const BookingShimmer = () => {
  return (
    <View style={styles.container}>
      <View style={styles.cover}>
        <AnimatedShimmer />
      </View>
      <View style={styles.title}>
        <AnimatedShimmer />
      </View>
      <View style={styles.infoList}>
        <View style={styles.infoListItem}>
          <AnimatedShimmer />
        </View>
        <View style={styles.infoListItem}>
          <AnimatedShimmer />
        </View>
        <View style={styles.infoListItem}>
          <AnimatedShimmer />
        </View>
      </View>
      <View style={styles.sectionTitle}>
        <AnimatedShimmer />
      </View>
      <View style={styles.roomInfo}>
        <AnimatedShimmer />
      </View>
      <View style={styles.sectionTitle}>
        <AnimatedShimmer />
      </View>
    </View>
  );
};

export default memo(BookingShimmer);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  cover: {
    aspectRatio: 4 / 3,
    width: "100%",
    borderRadius: 12,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  title: {
    width: 180,
    height: 50,
    marginVertical: 24,
  },
  infoList: {
    gap: 16,
  },
  infoListItem: {
    width: "100%",
    height: 40,
  },
  sectionTitle: {
    width: 180,
    height: 42,
    marginVertical: 16,
  },
  roomInfo: {
    width: "100%",
    height: 100,
  },
});
