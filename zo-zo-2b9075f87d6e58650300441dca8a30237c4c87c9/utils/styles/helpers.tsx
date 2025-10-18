// bunch of reusable helper styles.

import device from "@/config/Device";
import { StyleSheet } from "react-native";

const helpers = StyleSheet.create({
  flex: {
    flex: 1,
  },
  stretch: {
    flex: 1,
    alignSelf: "stretch",
  },
  fit: {
    width: "100%",
    height: "100%",
  },
  wFit: {
    width: "100%",
  },
  fitCenter: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  flexCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  flexLoader: {
    flex: 1,
    marginVertical: 72
  },
  row: {
    flexDirection: "row",
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  flexRowBetween: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-between",
  },
  absolute: {
    position: "absolute",
  },
  absoluteEnds: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  absoluteFit: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
  },
  absoluteCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  absoluteFitCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  deviceFit: {
    width: device.WINDOW_WIDTH,
    aspectRatio: 1,
  },
});

export default helpers;

export const percentToHexOpacity = (percent: number) => {
  const percentValue = Math.min(100, Math.max(0, percent));
  const opacity = Math.round((percentValue / 100) * 255);
  return opacity.toString(16).padStart(2, "0").toUpperCase();
};
