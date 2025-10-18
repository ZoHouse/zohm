import { Dimensions, Platform } from "react-native";

const device = {
  WINDOW_WIDTH: Dimensions.get("screen").width,
  WINDOW_HEIGHT: Dimensions.get("screen").height,
  ASPECT_RATIO:
    Dimensions.get("screen").width / Dimensions.get("screen").height,
  isAndroid: Platform.OS === "android",
};

export default device;
