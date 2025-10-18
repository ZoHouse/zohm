import { Platform, StyleSheet } from "react-native";
import { memo, useEffect } from "react";
import { ImageProps, Image } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";

export const ZoToken = memo((props: ImageProps) => {
  return (
    <Image
      source={require("@/assets/images/zotoken.png")}
      resizeMode="contain"
      {...props}
    />
  );
});

export const ZoVideo = memo(() => {
  const videoPlayer = useVideoPlayer(
    require("@/assets/videos/coinRotation.mp4"),
    (player) => {
      //   player.muted = true;
      player.loop = true;
    }
  );

  useEffect(() => {
    videoPlayer.play();
  }, []);

  return (
    <VideoView
      player={videoPlayer}
      nativeControls={false}
      contentFit="contain"
    />
  );
});

export const ZoAvatarView = memo(() =>
  Platform.OS === "ios" ? (
    <ZoTokenVideo />
  ) : (
    <ZoToken style={styles.tokenVideo} />
  )
);

export const ZoTokenVideo = memo(() => {
  const videoPlayer = useVideoPlayer(
    require("@/assets/videos/coinRotation.mp4"),
    (player) => {
      //   player.muted = true;
      player.loop = true;
    }
  );

  useEffect(() => {
    videoPlayer.play();
  }, []);

  return Platform.OS === "ios" ? (
    <VideoView
      player={videoPlayer}
      style={styles.tokenVideo}
      contentFit="contain"
      nativeControls={false}
    />
  ) : (
    <ZoToken style={styles.tokenVideo} />
  );
});

const styles = StyleSheet.create({
  tokenVideo: {
    width: 16,
    height: 16,
    borderRadius: 100,
    borderCurve: "continuous",
    overflow: "hidden",
  },
});
