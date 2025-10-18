import { useCallback, useMemo } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { Chip, Pressable, Text, ThemeView } from "@/components/ui";
import { Track } from "@/definitions/explore";
import helpers from "@/utils/styles/helpers";
import { LinearGradient } from "expo-linear-gradient";
import device from "@/config/Device";
import { useThemeColors } from "@/context/ThemeContext";
import { handleDeepLink } from "@/utils/deep-linking";
import ZoImage from "@/components/ui/ZoImage";

interface SwipeItemProps {
  track: Track;
}

const SwipeItem = ({ track }: SwipeItemProps) => {
  const [dark] = useThemeColors(["Vibes.Dark"]);

  const colors = useMemo(() => {
    return [`${dark}00`, `${dark}79`, dark] as const;
  }, [dark]);

  const onPress = useCallback(() => {
    handleDeepLink(track.deeplink, track.link);
  }, [track]);

  return (
    <Pressable activeOpacity={1} onPress={onPress}>
      <Chip stroke="Light" curve={16} style={styles.track}>
        <View style={styles.imageContainer}>
          <ZoImage id={null} url={track.media} width="m" />
          <LinearGradient style={styles.gradient} colors={colors} />
        </View>
        <View style={styles.info}>
          <View style={helpers.flex} />
          <ThemeView theme="Vibes.Green" style={styles.category}>
            <Text type="Tertiary" color="Dark">
              🎉 {track.category}
            </Text>
          </ThemeView>
          <Text type="SectionTitle" color="Light">
            {track.title}
          </Text>
        </View>
      </Chip>
    </Pressable>
  );
};

export default SwipeItem;

const styles = StyleSheet.create({
  category: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 56,
    borderCurve: "continuous",
  },
  info: {
    ...helpers.fit,
    padding: 16,
    gap: 8,
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: "60%",
  },
  imageContainer: {
    ...helpers.absoluteFit,
    borderRadius: 16,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  track: {
    ...helpers.fit,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
});
