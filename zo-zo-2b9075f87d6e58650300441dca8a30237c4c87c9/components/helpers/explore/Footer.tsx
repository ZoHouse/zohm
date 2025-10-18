import { View, StyleSheet } from "react-native";
import React, { memo } from "react";
import FollowYourHeart from "./FollowYourHeart";
import Scenary from "./Scenary";
import { useIsFocused } from "@react-navigation/native";
import { useFeedLoaded, useFootStore } from "@/utils/store/explore";

const Footer = memo(() => {
  const isFocused = useIsFocused();
  const isBottom = useFootStore();
  const play = isFocused && isBottom;
  const isFeedLoaded = useFeedLoaded();
  if (!isFeedLoaded) {
    return <></>;
  }

  return (
    <View style={styles.container}>
      <FollowYourHeart play={play} />
      <Scenary />
    </View>
  );
});

export default Footer;

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
});
