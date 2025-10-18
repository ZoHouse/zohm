import React, { memo } from "react";
import { Image, ImageStyle } from "expo-image";
import { StyleProp } from "react-native";

interface StayConfirmedCardHolderProps {
  style?: StyleProp<ImageStyle>;
}

const StayConfirmedCardHolder = ({ style }: StayConfirmedCardHolderProps) => {
  return (
    <Image
      source={require("@/assets/vectors/checkin/card-holder.svg")}
      contentFit="contain"
      style={[{ width: 240, height: 232 }, style]}
    />
  );
};

export default memo(StayConfirmedCardHolder);
