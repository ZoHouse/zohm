import { useThemeColors } from "@/context/ThemeContext";
import { Image } from "expo-image";
import LottieView from "lottie-react-native";
import { memo, useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";

const FollowYourHeart = memo(({ play }: { play: boolean }) => {
  const lottieRef = useRef<LottieView>(null);

  useEffect(() => {
    if (play) {
      lottieRef.current?.play();
    } else {
      lottieRef.current?.pause();
    }
  }, [play]);

  const [textColor] = useThemeColors(["Text.Primary"]);

  return (
    <View style={styles.container}>
      <View>
        <Image
          source={require("@/assets/vectors/explore/followYour.svg")}
          style={styles.followYour}
          tintColor={textColor}
        />
        <View style={styles.lottieView}>
          <LottieView
            source={require("@/assets/lottie/follow-your-heart.json")}
            loop
            ref={lottieRef}
            style={styles.size}
          />
        </View>
      </View>
    </View>
  );
});

export default FollowYourHeart;

const styles = StyleSheet.create({
  size: {
    width: 56,
    height: 56,
  },
  lottieView: {
    width: 56,
    height: 56,
    position: "absolute",
    bottom: 0,
    right: 0,
    transform: [
      { translateY: "-40%" },
      { translateX: "30%" },
      { rotate: "15deg" },
    ],
  },
  followYour: {
    width: "40%",
    aspectRatio: 115 / 90,
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
});
