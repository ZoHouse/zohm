import { View, StyleSheet } from "react-native";
import React, { memo } from "react";
import { AnimatedShimmer } from "@/components/ui";

const DestinationShimmer = () => {
  return (
    <View style={styles.container}>
      <View style={styles.cover}>
        <AnimatedShimmer />
      </View>
      <View style={styles.title}>
        <AnimatedShimmer />
      </View>
      <View style={styles.about}>
        <AnimatedShimmer />
      </View>
      <View style={styles.sectionTitle}>
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

export default memo(DestinationShimmer);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  cover: {
    aspectRatio: 1,
    width: "100%",
    borderRadius: 12,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  title: {
    width: 280,
    height: 50,
    marginVertical: 24,
    alignSelf: "center",
  },
  sectionTitle: {
    width: 240,
    height: 64,
    marginVertical: 24,
    alignSelf: "center",
  },
  about: {
    alignSelf: "stretch",
    height: 100,
    marginVertical: 8,
  },
  infoList: {
    gap: 16,
  },
  infoListItem: {
    width: "100%",
    height: 40,
  },

  roomInfo: {
    width: "100%",
    height: 100,
  },
});
