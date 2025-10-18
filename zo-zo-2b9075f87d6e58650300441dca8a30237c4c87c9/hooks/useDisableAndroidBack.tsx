import { useIsFocused } from "@react-navigation/native";
import { useEffect } from "react";
import { BackHandler } from "react-native";

const backAction = () => true;
export default function useDisableAndroidBack(condition = true) {
  const isFocused = useIsFocused();
  useEffect(() => {
    if (!isFocused || !condition) return;
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, [isFocused, condition]);
}
