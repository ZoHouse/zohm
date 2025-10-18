import React, { useMemo } from "react";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { StyleSheet, View } from "react-native";
import constants from "@/utils/constants";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeColors } from "@/context/ThemeContext";
import Sheet from "@/components/sheets/Base";
import SafeAreaView from "@/components/ui/SafeAreaView";
import Text from "@/components/ui/Text";
import Pressable from "@/components/ui/Pressable";
import ZoImage from "@/components/ui/ZoImage";

interface AlertSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  variant: "gender" | "kids";
}

const AlertSheet = ({
  isOpen,
  onClose,
  title,
  description,
  variant,
}: AlertSheetProps) => {
  const [bg] = useThemeColors(["Background.Sheet"]);
  const gradientColors = useMemo(() => [`${bg}00`, bg] as const, [bg]);

  return (
    <Sheet
      isOpen={isOpen}
      onDismiss={onClose}
      enableDynamicSizing
      maxDynamicContentSize={700}
    >
      <BottomSheetView>
        <SafeAreaView safeArea="bottom" style={styles.container}>
          <View style={styles.imageContainer}>
            <ZoImage
              url={
                variant === "gender"
                  ? constants.assetURLS.noMales
                  : constants.assetURLS.noKids
              }
              width={240}
            />
            <LinearGradient
              colors={gradientColors}
              style={styles.gradient}
              start={start}
              end={end}
            />
          </View>
          <View>
            <Text center type="Title" style={styles.title}>
              {title}
            </Text>
            <Text center>{description}</Text>
          </View>
          <Pressable style={styles.button} onPress={onClose}>
            <Text type="TextHighlight" color="ButtonSecondary" center>
              Got it
            </Text>
          </Pressable>
        </SafeAreaView>
      </BottomSheetView>
    </Sheet>
  );
};

export default AlertSheet;

const start = { x: 0, y: 0.5 };
const end = { x: 0, y: 1 };

const styles = StyleSheet.create({
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  title: {
    marginBottom: 8,
  },
  button: { marginTop: 24 },
  imageContainer: { width: 180, height: 162, marginBottom: 8 },
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginBottom: 8,
  },
});
