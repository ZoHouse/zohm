import { Linking, StyleSheet, View } from "react-native";
import React, { useCallback, useMemo } from "react";
import { Track } from "@/definitions/explore";
import Text from "@/components/ui/Text";
import { Pressable } from "@/components/ui";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import helpers from "@/utils/styles/helpers";
import ZoImage from "@/components/ui/ZoImage";

interface TrackProps {
  track: Track;
  size: { width: number; height: number };
  isVisible: boolean;
}

const TrackItem = ({ track, size, isVisible = false }: TrackProps) => {
  const imgStyle = useMemo(() => {
    return [
      {
        width: size.width,
        height: size.height,
      },
      styles.imageView,
    ];
  }, [size]);

  const textStyle = useMemo(() => {
    return {
      width: size.width,
    };
  }, [size]);

  const onPress = useCallback(() => {
    if (
      !track.deeplink ||
      track.deeplink === "zostel://meta" ||
      track.deeplink === "zostel://"
    ) {
      return;
    }
    Linking.openURL(track.deeplink);
  }, [track.deeplink]);

  const logoSource = useMemo(() => {
    return { uri: track.media_category_logo };
  }, [track.media_category_logo]);

  return (
    <Pressable activeOpacity={0.8} style={styles.trackView} onPress={onPress}>
      <View style={imgStyle}>
        <ZoImage url={track.media} width="m" id={track.id} alt={track.title} />
        {track.media_category_logo ? (
          <Image
            source={logoSource}
            style={styles.logo}
            contentFit="cover"
            cachePolicy="disk"
          />
        ) : null}
        {track.category ? (
          <View style={styles.blur}>
            <BlurView
              style={helpers.absoluteFit}
              tint="systemUltraThinMaterialDark"
              intensity={80}
            />
            <Text type="Tertiary" color="Light" style={styles.category}>
              {track.category}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.trackText}>
        {track.title ? (
          <Text style={textStyle} numberOfLines={2}>
            {track.title}
          </Text>
        ) : null}
        {track.subtitle ? (
          <Text
            style={textStyle}
            color="Secondary"
            type="Subtitle"
            numberOfLines={2}
          >
            {track.subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
};

export default TrackItem;

const styles = StyleSheet.create({
  trackView: {
    gap: 8,
    marginRight: 16,
  },
  trackText: {
    gap: 4,
  },
  imageView: {
    borderRadius: 16,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  logo: {
    position: "absolute",
    top: 12,
    right: 12,
    overflow: "hidden",
    borderRadius: 100,
    borderCurve: "continuous",
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  blur: {
    position: "absolute",
    left: 16,
    bottom: 16,
    overflow: "hidden",
    borderRadius: 100,
    borderCurve: "continuous",
  },
  category: {
    marginHorizontal: 8,
    marginVertical: 4,
  },
});
