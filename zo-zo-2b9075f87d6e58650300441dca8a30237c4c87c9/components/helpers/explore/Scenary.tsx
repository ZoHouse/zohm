import { useTheme } from "@/context/ThemeContext";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Image } from "expo-image";
import { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";

const Scenary = () => {
  const bottom = useBottomTabBarHeight();
  const { colorScheme } = useTheme();
  const style = useMemo(
    () => [styles.container, { marginBottom: bottom }],
    [bottom]
  );
  return (
    <View style={style}>
      <Image
        style={styles.scenary}
        contentFit="contain"
        source={
          colorScheme === "dark"
            ? require("@/assets/images/foot-night-2.jpg")
            : require("@/assets/images/foot-day-2.jpg")
        }
      />
    </View>
  );
};

export default memo(Scenary);

const styles = StyleSheet.create({
  scenary: {
    width: "100%",
    height: "100%",
  },
  container: {
    width: "100%",
    aspectRatio: 540 / 495,
  },
});
