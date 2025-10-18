import { View, StyleSheet } from "react-native";
import React, { memo } from "react";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { AnimatedShimmer, SafeAreaView } from "@/components/ui";
import { ThemeProvider } from "@/context/ThemeContext";
import helpers from "@/utils/styles/helpers";

export const SpotlightShimmer = memo(() => {
  return (
    <ThemeProvider force="dark">
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        key="spotlight-shimmer"
        style={styles.spotlightShimmer}
      >
        <View style={styles.spotlightCard}>
          <AnimatedShimmer />
        </View>
        <View style={styles.spotlightCard}>
          <AnimatedShimmer />
        </View>
      </Animated.View>
    </ThemeProvider>
  );
});

export const TripShimmer = memo(() => {
  return (
    <Animated.View
      entering={FadeIn}
      key="trip-shimmer"
      exiting={FadeOut}
      style={styles.tripShimmer}
    >
      <View style={styles.tripCard}>
        <AnimatedShimmer />
      </View>
      <View style={styles.tripCard}>
        <AnimatedShimmer />
      </View>
    </Animated.View>
  );
});

export const TripInfoShimmer = memo(() => (
  <Animated.View
    entering={FadeIn}
    key="trip-shimmer"
    exiting={FadeOut}
    style={styles.tripInfo}
  >
    <SafeAreaView safeArea="top" />
    <View style={styles.head} />
    <View style={styles.tripCarousel}>
      <AnimatedShimmer />
    </View>
    <View style={styles.tripTitle}>
      <AnimatedShimmer />
    </View>
    <View style={styles.tripDatesListContainer}>
      <View style={styles.tripDateChip}>
        <AnimatedShimmer />
      </View>
      <View style={styles.tripDateChip}>
        <AnimatedShimmer />
      </View>
    </View>
    <View style={styles.tripBottom}>
      <AnimatedShimmer />
    </View>
  </Animated.View>
));

const styles = StyleSheet.create({
  head: {
    height: 56,
    marginBottom: 8,
  },
  info: {
    width: 300,
    height: 300,
  },
  shimmer: {
    borderRadius: 16,
    borderCurve: "continuous",
    width: "100%",
    height: "100%",
  },
  tripShimmer: { flexDirection: "row", padding: 24, gap: 16 },
  tripCard: {
    width: 240,
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: "hidden",
    borderCurve: "continuous",
  },
  spotlightShimmer: { flexDirection: "row", paddingHorizontal: 24, gap: 16 },
  spotlightCard: {
    width: 270,
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: "hidden",
    borderCurve: "continuous",
  },
  tripTitle: {
    height: 56,
    width: "100%",
    marginVertical: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  tripDatesListContainer: {
    gap: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  tripDateChip: {
    overflow: "hidden",
    borderRadius: 160,
    borderCurve: "continuous",
    width: 140,
    height: 42,
  },
  tripCarousel: {
    width: "100%",
    aspectRatio: 312 / 440,
    borderRadius: 16,
    overflow: "hidden",
    borderCurve: "continuous",
  },
  tripInfo: {
    ...helpers.stretch,
    padding: 24,
    paddingTop: 0,
  },
  tripBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 110,
  },
});
