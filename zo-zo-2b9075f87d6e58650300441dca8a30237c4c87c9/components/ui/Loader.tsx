import { memo } from "react";
import { View } from "react-native";
import LottieView from "lottie-react-native";
import helpers from "@/utils/styles/helpers";

const Loader = memo((props: { width?: number; height?: number }) => {
  return (
    <View style={helpers.center}>
      <LottieView
        source={require("@/assets/lottie/zostelloader.json")}
        autoPlay
        key="zostel-loader"
        loop
        style={{
          width: props.width ?? 36,
          height: props.height ?? 36,
        }}
      />
    </View>
  );
});

export default Loader;
