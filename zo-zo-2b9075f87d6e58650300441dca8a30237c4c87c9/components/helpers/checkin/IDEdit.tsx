import { StyleSheet, View } from "react-native";
import React, { memo, useEffect } from "react";
import { Iconz, SectionTitle, Text } from "../../ui";
import ImageProcessingLoader from "./ImageProcessing";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { IDState } from "@/definitions/checkin";
import { ZostelProfileAsset } from "@/definitions/profile";
import ZoImage from "@/components/ui/ZoImage";

const IDEdit = ({
  id,
  profileMedia,
  isPreview,
}: {
  id: IDState;
  profileMedia?: { front: ZostelProfileAsset; back?: ZostelProfileAsset };
  isPreview?: boolean;
}) => {
  const identifier =
    id.side === "front" ? profileMedia?.front.identifier : null;
  const src =
    id.side === "front"
      ? isPreview
        ? id.front?.path ?? profileMedia?.front.file
        : id.front?.path
      : isPreview
      ? id.back?.path ?? profileMedia?.back?.file
      : id.back?.path;

  return (
    <View style={styles.pt}>
      <SectionTitle noHorizontalPadding type="Title">
        {id.side === "front" ? "ID Card Front" : "ID Card Back"}
      </SectionTitle>
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <ZoImage key={src} url={src ?? ""} width={null} />
        </View>
        {id.isUploading ? <LoadingView /> : null}
      </View>
      {id.isUploading ? (
        <ImageProcessingLoader showSubtitle={id.side === "front"} />
      ) : identifier ? (
        <View style={styles.id}>
          <Text>
            Number: <Text type="TextHighlight">{identifier}</Text>
          </Text>
          <Iconz name="check-circle" size={16} fill="#54B835" />
        </View>
      ) : (
        <></>
      )}
    </View>
  );
};

export default IDEdit;

const styles = StyleSheet.create({
  id: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 0,
  },
  imageContainer: {
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: "#11111129",
    borderRadius: 12,
    borderCurve: "continuous",
    width: "100%",
    overflow: "hidden",
  },
  container: {
    marginTop: 8,
    marginBottom: 24,
    alignSelf: "stretch",
    justifyContent: "center",
    alignItems: "center",
  },
  pt: { paddingTop: 16 },
  dot: {
    width: 4,
    height: 4,
    backgroundColor: "#fff",
    borderRadius: 4,
  },
  dotContainer: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  loading: {
    aspectRatio: 1,
    width: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#11111129",
    borderRadius: 12,
    borderCurve: "continuous",
    flexDirection: "row",
    flexWrap: "wrap",
    overflow: "hidden",
    paddingLeft: 4,
    paddingTop: 4,
    justifyContent: "center",
    alignItems: "center",
  },
});

const LoadingView = memo(() => {
  return (
    <Animated.View style={styles.loading}>
      {numbers.map((i) => (
        <BlinkingDot key={i} delay={i * 10} />
      ))}
    </Animated.View>
  );
});

const numbers = Array.from({ length: 150 }, (_, i) => i + 1);

const BlinkingDot = ({ delay }: { delay: number }) => {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 1000 }), -1, true)
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <View style={styles.dotContainer}>
      <Animated.View style={[styles.dot, animatedStyle]} />
    </View>
  );
};
