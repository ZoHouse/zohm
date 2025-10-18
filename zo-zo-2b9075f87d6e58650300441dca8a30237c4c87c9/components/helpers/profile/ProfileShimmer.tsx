import { View, StyleSheet } from "react-native";
import React, { memo } from "react";
import SafeAreaView from "@/components/ui/SafeAreaView";
import PulsatingShimmer from "@/components/ui/AnimatedShimmer";

const AnimatedShimmer = () => {
  return <PulsatingShimmer curve={16} />;
};

const ProfileShimmer = memo(() => {
  return (
    <SafeAreaView safeArea style={styles.stretch}>
      <View style={styles.container}>
        <View style={styles.topSection}>
          <View style={styles.stackBox}>
            <AnimatedShimmer />
          </View>
        </View>
        <View style={styles.title}>
          <AnimatedShimmer />
        </View>
        <RowShimmer />
        <RowShimmer />
        <RowShimmer />
        <RowShimmer />
        <RowShimmer />
      </View>
    </SafeAreaView>
  );
});

const RowShimmer = () => (
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
    width: "100%",
    height: 40,
    borderCurve: "continuous",
    overflow: "hidden",
    marginBottom: 16,
  },
  container: {
    flex: 1,
    alignSelf: "stretch",
    padding: 24,
  },
  topSection: {
    marginVertical: 16,
    marginTop: 48,
    height: 320,
    alignItems: "center",
    justifyContent: "center",
  },
  stackBox: {
    borderRadius: 16,
    borderCurve: "continuous",
    width: 280,
    height: 320,
  },
  shimmer: {
    borderRadius: 16,
    width: "100%",
    height: "100%",
  },
  title: {
    marginVertical: 16,
    height: 56,
    marginBottom: 32,
    borderRadius: 16,
    borderCurve: "continuous",
    width: "70%",
  },
});

export default ProfileShimmer;
