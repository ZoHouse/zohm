import { View, StyleSheet } from "react-native";
import React, { memo } from "react";
import device from "@/config/Device";
import SafeAreaView from "@/components/ui/SafeAreaView";
import PulsatingShimmer from "@/components/ui/AnimatedShimmer";

const AnimatedShimmer = () => {
  return <PulsatingShimmer curve={16} />;
};

export const LocationShimmer = () => {
  return (
    <View style={styles.locationShimmer}>
      <AnimatedShimmer />
    </View>
  );
};

const ExploreShimmer = memo(() => {
  return (
    <SafeAreaView safeArea style={styles.stretch}>
      <View style={styles.container}>
        <View style={styles.profileRow}>
          <View style={styles.profileAvatar}>
            <AnimatedShimmer />
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.profileTitle}>
              <AnimatedShimmer />
            </View>
            <View style={styles.profileSubtitle}>
              <AnimatedShimmer />
            </View>
          </View>
        </View>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <AnimatedShimmer />
          </View>
          <View style={styles.searchButton}>
            <AnimatedShimmer />
          </View>
        </View>
        <View style={styles.topSection}>
          <View style={styles.stackBox3}>
            <AnimatedShimmer />
          </View>
          <View style={styles.stackBox2}>
            <AnimatedShimmer />
          </View>
          <View style={styles.stackBox}>
            <AnimatedShimmer />
          </View>
        </View>
        <View style={styles.title}>
          <AnimatedShimmer />
        </View>
        <View style={styles.bottomSection}>
          <View style={styles.leftBox}>
            <AnimatedShimmer />
          </View>
          <View style={styles.rightBox}>
            <AnimatedShimmer />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
});

export const RowShimmer = () => (
  <View style={styles.rowShimmer}>
    <AnimatedShimmer />
  </View>
);

const styles = StyleSheet.create({
  stretch: {
    flex: 1,
    alignSelf: "stretch",
  },
  rowShimmer: {
    borderRadius: 16,
    width: 150,
    height: 20,
    borderCurve: "continuous",
    overflow: "hidden",
    marginTop: 1,
  },
  container: {
    flex: 1,
    alignSelf: "stretch",
    padding: 24,
  },
  profileRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 40,
    overflow: "hidden",
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileTitle: {
    width: 140,
    height: 24,
    borderRadius: 16,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  profileSubtitle: {
    width: 180,
    height: 18,
    borderRadius: 18,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  searchRow: {
    flexDirection: "row",
    gap: 16,
    marginVertical: 16,
  },
  searchBar: {
    flex: 1,
    height: 56,
    borderRadius: 24,
    overflow: "hidden",
  },
  searchButton: {
    width: 56,
    height: 56,
    borderRadius: 56,
    overflow: "hidden",
  },
  contentWrapper: {
    flex: 1,
    alignSelf: "stretch",
    gap: 16,
  },
  topBox: {
    alignSelf: "stretch",
    marginHorizontal: 24,
    flex: 1,
    borderRadius: 16,
    borderCurve: "continuous",
  },
  topSection: {
    marginVertical: 16,
    height: 320,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomSection: {
    height: device.WINDOW_HEIGHT / 3,
    gap: 16,
    flexDirection: "row",
  },
  leftBox: {
    width: 232,
    height: "100%",
    borderRadius: 16,
    borderCurve: "continuous",
  },
  locationShimmer: {
    width: 200,
    height: 30,
    borderRadius: 24,
    borderCurve: "continuous",
  },
  rightBox: {
    flex: 1,
    borderRadius: 16,
    borderCurve: "continuous",
    height: "100%",
  },
  stackBox: {
    borderRadius: 16,
    borderCurve: "continuous",
    width: 280,
    height: 320,
  },
  stackBox2: {
    position: "absolute",
    borderRadius: 16,
    borderCurve: "continuous",
    width: 280,
    height: 320,
    transform: [{ rotate: "-10deg" }],
  },
  stackBox3: {
    position: "absolute",
    borderRadius: 16,
    borderCurve: "continuous",
    width: 280,
    height: 320,
    transform: [{ rotate: "10deg" }],
  },
  shimmer: {
    borderRadius: 16,
    width: "100%",
    height: "100%",
  },
  title: {
    marginVertical: 16,
    height: 64,
    borderRadius: 16,
    borderCurve: "continuous",
  },
});

export default ExploreShimmer;
