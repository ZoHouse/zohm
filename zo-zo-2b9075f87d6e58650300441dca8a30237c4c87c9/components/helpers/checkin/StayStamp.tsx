import { View, Text } from "react-native";
import React, { memo } from "react";
import { Image } from "expo-image";

const StayStamp = () => {
  return (
    <Image
      source={require("@/assets/vectors/checkin/stamp.svg")}
      contentFit="contain"
      style={{ width: 122, height: 122 }}
    />
  );
};

export default memo(StayStamp);
