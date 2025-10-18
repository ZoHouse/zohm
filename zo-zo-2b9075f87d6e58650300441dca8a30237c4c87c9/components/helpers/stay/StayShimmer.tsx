import { StyleSheet, View } from "react-native";
import React, { memo } from "react";
import AnimatedShimmer from "@/components/ui/AnimatedShimmer";

const TitleShimmer = () => (
  <View style={styles.titleContainer}>
    <View style={styles.title}>
      <AnimatedShimmer />
    </View>
  </View>
);

const CarouselShimmer = () => (
  <View style={styles.carouselContainer}>
    <View style={styles.carousel}>
      <View style={styles.ccItem1}>
        <AnimatedShimmer />
      </View>
      <View style={styles.ccItem2}>
        <AnimatedShimmer />
      </View>
    </View>
  </View>
);

const ChipShimmer = () => (
  <View style={styles.chip}>
    <AnimatedShimmer />
  </View>
);

const AdultChipShimmer = () => (
  <View style={styles.adult}>
    <AnimatedShimmer />
  </View>
);

const AboutTitleShimmer = () => (
  <View style={styles.about}>
    <AnimatedShimmer />
  </View>
);

const DescriptionShimmer = () => (
  <View style={styles.description}>
    <AnimatedShimmer />
  </View>
);

const BookbarShimmer = () => (
  <View style={styles.bookbar}>
    <AnimatedShimmer />
  </View>
);

const StayShimmer = () => {
  return (
    <View style={styles.container}>
      <TitleShimmer />
      <CarouselShimmer />
      <ChipShimmer />
      <AdultChipShimmer />
      <AboutTitleShimmer />
      <DescriptionShimmer />
      <BookbarShimmer />
    </View>
  );
};

export default memo(StayShimmer);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bookbar: { width: "100%", height: 110, position: "absolute", bottom: 0 },
  description: {
    width: "100%",
    height: 300,
    marginTop: 24,
    paddingHorizontal: 24,
  },
  about: {
    width: 200,
    height: 48,
    borderRadius: 12,
    borderCurve: "continuous",
    overflow: "hidden",
    marginLeft: 24,
  },
  adult: {
    width: 240,
    height: 38,
    borderRadius: 100,
    borderCurve: "continuous",
    overflow: "hidden",
    marginVertical: 32,
    marginBottom: 16,
    alignSelf: "center",
  },
  ccItem2: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    borderRadius: 12,
    position: "absolute",
  },
  ccItem1: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    borderRadius: 12,
    position: "absolute",
    transform: [{ rotate: "20deg" }, { translateX: 260 }, { translateY: -30 }],
  },
  carousel: { width: 264, height: 300, alignSelf: "center" },
  carouselContainer: { width: "100%", height: 300, marginTop: 24 },
  chip: {
    width: 132,
    height: 38,
    borderRadius: 100,
    borderCurve: "continuous",
    overflow: "hidden",
    marginTop: 48,
    alignSelf: "center",
  },
  title: {
    height: 56,
    width: 240,
    borderRadius: 12,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  titleContainer: {
    height: 56,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
