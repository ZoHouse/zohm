import { memo, useEffect, useState } from "react";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { StyleSheet } from "react-native";
import { Text } from "@/components/ui";

const processingSteps = [
  "🔍 Scanning...",
  "📄 Processing...",
  "🧠 Analyzing...",
  "🔄 Verifying...",
  "✅ Almost there...",
];

const ImageProcessingLoader = memo(
  ({ showSubtitle }: { showSubtitle?: boolean }) => {
    const [step, setStep] = useState(0);

    useEffect(() => {
      const interval = setInterval(() => {
        setStep((prev) => Math.min(prev + 1, processingSteps.length - 1));
      }, 5000);
      return () => clearInterval(interval);
    }, []);

    return (
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        style={styles.container}
      >
        {processingSteps.map((pstep, index) =>
          index === step ? (
            <Animated.View key={index} entering={FadeIn} exiting={FadeOut}>
              <Text>{pstep}</Text>
            </Animated.View>
          ) : null
        )}
        {showSubtitle ? (
          <Text style={styles.subText} color="Secondary" type="Subtitle" center>
            Usually takes 20-30 seconds.
          </Text>
        ) : null}
      </Animated.View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },
  subText: {
    marginTop: 16,
  },
});

export default memo(ImageProcessingLoader);
