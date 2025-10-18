import * as Haptics from "expo-haptics";
import { Href, useRouter } from "expo-router";
import { SquircleButton } from "expo-squircle-view";
import React, { useCallback, useMemo } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useThemeColors } from "../../context/ThemeContext";
import Text from "./Text";
import Pressable from "./Pressable";
import helpers from "@/utils/styles/helpers";
import ProgressBar from "./ProgressBar";
import Iconz from "./Iconz";

interface ButtonProps {
  children: React.ReactNode;
  subtitle?: string;
  variant?: "primary" | "secondary" | "tertiary";
  style?: any;
  onPress?: () => void;
  href?: Href;
  isLoading?: boolean;
  isDisabled?: boolean;
  uploadProgress?: number;
}

const PrimaryButton: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  style,
  isLoading = false,
  isDisabled = false,
  subtitle,
  uploadProgress,
  ...props
}) => {
  const [
    strokePrimary,
    buttonPrimary,
    loader,
    disabled,
    loaderPrimary,
    loaderSecondary,
  ] = useThemeColors([
    "Stroke.Primary",
    "Button.Primary",
    "Text.Button",
    "Background.Disabled",
    "Background.Primary",
    "Icon.ViewOnly",
  ]);

  const buttonStyle = useMemo(() => {
    return [styles.button, style];
  }, [style]);

  return (
    <SquircleButton
      onPress={props.onPress}
      backgroundColor={isDisabled ? disabled : buttonPrimary}
      borderColor={strokePrimary}
      borderWidth={2}
      disabled={isDisabled || isLoading}
      style={buttonStyle}
      cornerSmoothing={100}
      borderRadius={12}
      {...props}
    >
      {isLoading && typeof uploadProgress === "number" ? (
        <Animated.View
          entering={FadeIn.duration(100)}
          exiting={FadeOut.duration(100)}
          style={helpers.fitCenter}
        >
          {uploadProgress === 100 ? (
            <Iconz name="check-circle" size={24} fillTheme="Action" />
          ) : (
            <ProgressBar
              size={24}
              total={100}
              current={uploadProgress ?? 0}
              primaryStroke={loaderPrimary}
              secondaryStroke={loaderSecondary}
            />
          )}
        </Animated.View>
      ) : isLoading ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={styles.loaderContainer}
        >
          <ActivityIndicator size="small" color={loader} />
        </Animated.View>
      ) : (
        <View style={styles.buttonContent}>
          <Text
            color={isDisabled ? "Disabled" : "Button"}
            type="BigButton"
            children={children}
          />
          {subtitle && (
            <Text color="Button" type="Tertiary">
              {subtitle}
            </Text>
          )}
        </View>
      )}
    </SquircleButton>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  loaderContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  underline: {
    textDecorationLine: "underline",
  },
  buttonContent: {
    alignItems: "center",
    justifyContent: "center",
  },
});

const SecondaryButton = (props: ButtonProps) => {
  const buttonStyle = useMemo(() => {
    return [styles.button, props.style];
  }, [props.style]);

  const [strokePrimary, loader] = useThemeColors([
    "Stroke.Primary",
    "Text.ButtonSecondary",
    "Text.Button",
  ]);

  return (
    <SquircleButton
      onPress={props.onPress}
      backgroundColor={"transparent"}
      borderColor={strokePrimary}
      borderWidth={2}
      style={buttonStyle}
      cornerSmoothing={100}
      disabled={props.isDisabled || props.isLoading}
      borderRadius={12}
      {...props}
    >
      {props.isLoading ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={styles.loaderContainer}
        >
          <ActivityIndicator size="small" color={loader} />
        </Animated.View>
      ) : (
        <Text
          color={props.isDisabled ? "Disabled" : "ButtonSecondary"}
          type="BigButton"
        >
          {props.children}
        </Text>
      )}
    </SquircleButton>
  );
};

const TertiaryButton = (props: ButtonProps) => {
  const [loader] = useThemeColors(["Text.ButtonSecondary"]);

  return (
    <Pressable
      disabled={props.isDisabled || props.isLoading}
      onPress={props.onPress}
      style={styles.button}
    >
      {props.isLoading ? (
        <ActivityIndicator size="small" color={loader} />
      ) : (
        <Text
          type="BigButton"
          color={props.isDisabled ? "Disabled" : "ButtonSecondary"}
          style={styles.underline}
        >
          {props.children}
        </Text>
      )}
    </Pressable>
  );
};

const Button: React.FC<ButtonProps> = ({ variant = "primary", ...props }) => {
  const router = useRouter();

  const handlePress = useCallback(() => {
    if (props.isLoading) return;

    if (props.href) {
      if (Platform.OS === "android") {
        Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Keyboard_Tap);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      router.push(props.href);
    } else if (props.onPress) {
      if (Platform.OS === "android") {
        Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Keyboard_Tap);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      props.onPress();
    }
  }, [props]);

  return variant === "primary" ? (
    <PrimaryButton {...props} onPress={handlePress} />
  ) : variant === "secondary" ? (
    <SecondaryButton {...props} onPress={handlePress} />
  ) : (
    <TertiaryButton {...props} onPress={handlePress} />
  );
};

export default Button;
