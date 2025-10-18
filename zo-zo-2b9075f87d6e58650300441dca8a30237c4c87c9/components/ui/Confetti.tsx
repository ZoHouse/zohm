import { View, Text } from "react-native";
import React, { memo } from "react";
import helpers from "@/utils/styles/helpers";
import LottieView from "lottie-react-native";

const Confetti = () => {
  return (
    <View style={helpers.absoluteFit} pointerEvents="none">
      <LottieView
        source={require("@/assets/lottie/success.json")}
        key="confetti"
        autoPlay
        loop={false}
        resizeMode="cover"
        style={helpers.fit}
      />
    </View>
  );
};

export default memo(Confetti);
