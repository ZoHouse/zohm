import { StyleSheet } from "react-native";
import React from "react";
import { Sheet } from "@/components/sheets";
import { useVideoPlayer, VideoView } from "expo-video";
import helpers from "@/utils/styles/helpers";
import { SafeAreaView } from "@/components/ui";

interface AboutZostelProps {
  isOpen: boolean;
  onDismiss: () => void;
}

const AboutZostel = ({ isOpen, onDismiss }: AboutZostelProps) => {
  const videoPlayer = useVideoPlayer(
    require("@/assets/videos/onboarding.mp4"),
    (player) => {
      player.play();
    }
  );

  return (
    <Sheet fullScreen isOpen={isOpen} onDismiss={onDismiss} hideHandle>
      <SafeAreaView safeArea style={styles.container}>
        <VideoView
          player={videoPlayer}
          contentFit="cover"
          style={helpers.fit}
          nativeControls
        />
      </SafeAreaView>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
  },
});

export default AboutZostel;
