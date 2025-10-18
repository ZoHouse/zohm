import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  LayoutRectangle,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import Animated, {
  AnimatedStyle,
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Circle, G, Text as SVGText, Svg, TextPath } from "react-native-svg";
import useProfile from "@/hooks/useProfile";
import { isValidString } from "@/utils/data-types/string";
import { triggerNotification } from "@/utils/haptics";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import ZText from "@/components/ui/Text";
import { logAxiosError } from "@/utils/network";
import Device from "@/config/Device";
import { BaseFemaleAvatar, BaseMaleAvatar } from "./BaseAvatars";
import { useThemeColors } from "@/context/ThemeContext";

interface AvatarSectionProps {
  onSubmit: () => void;
  fadeAvatar?: boolean;
}

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

const AvatarSection: React.FC<AvatarSectionProps> = ({
  onSubmit,
  fadeAvatar,
}) => {
  const { top, bottom } = useSafeAreaInsets();

  const { updateProfile, profile, refetchProfile } = useProfile();

  const [selectedBodyShape, setSelectedBodyShape] = useState<
    "bro" | "bae" | undefined
  >();
  const [isGeneratingAvatar, setGeneratingAvatar] = useState<boolean>(false);
  const [isAvatarGenerated, setAvatarGenerated] = useState<boolean>(false);

  const shapeCoordinates = useRef<Record<"bro" | "bae", LayoutRectangle>>({
    bro: {} as LayoutRectangle,
    bae: {} as LayoutRectangle,
  });

  const isInitialMount = useRef<{ bro: boolean; bae: boolean }>({
    bro: true,
    bae: true,
  });

  const handleLayout = (shape: "bro" | "bae", e: LayoutChangeEvent) => {
    if (isInitialMount.current[shape]) {
      shapeCoordinates.current[shape] = e.nativeEvent.layout;
      isInitialMount.current[shape] = false;
    }
  };

  const maleOpacity = useSharedValue<number>(1);
  const femaleOpacity = useSharedValue<number>(1);
  const titleOpacity = useSharedValue<number>(1);
  const borderRadius = useSharedValue<number>(24);
  const width = useSharedValue<number>(Device.WINDOW_WIDTH - 48);
  const height = useSharedValue<number>(
    (Device.WINDOW_HEIGHT - top - bottom - 280) / 2
  );
  const maleTranslateY = useSharedValue<number>(0);
  const femaleTranslateY = useSharedValue<number>(0);
  const circleTextOpacity = useSharedValue<number>(0);
  const circleTextScale = useSharedValue<number>(0.8);
  const counterRotation = useSharedValue<number>(0);
  const rotation = useSharedValue<number>(360);
  const innerCircleBorderWidth = useSharedValue<number>(0);
  const mainAvatarOpacity = useSharedValue<number>(0);

  const [textPrimary] = useThemeColors(["Text.Primary"]);

  useEffect(() => {
    if (fadeAvatar) {
      mainAvatarOpacity.value = 0;
      circleTextOpacity.value = withTiming(0);
    }
  }, [fadeAvatar]);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const maleStyle = useAnimatedStyle(() => ({
    opacity: maleOpacity.value,
    borderRadius: borderRadius.value,
    width: width.value,
    height: height.value,
    transform: [{ translateY: maleTranslateY.value }],
  }));

  const femaleStyle = useAnimatedStyle(() => ({
    opacity: femaleOpacity.value,
    borderRadius: borderRadius.value,
    width: width.value,
    height: height.value,
    transform: [{ translateY: femaleTranslateY.value }],
  }));

  const innerCircleStyle = useAnimatedStyle(() => ({
    borderRadius: borderRadius.value,
    borderWidth: innerCircleBorderWidth.value,
  }));

  const circularTextStyle = useAnimatedStyle(() => ({
    opacity: circleTextOpacity.value,
    transform: [
      { scale: circleTextScale.value },
      {
        rotate: `${counterRotation.value}deg`,
      },
    ],
  }));

  const counterCircularTextStyle = useAnimatedStyle(() => ({
    opacity: circleTextOpacity.value,
    transform: [
      { scale: circleTextScale.value },
      {
        rotate: `${rotation.value}deg`,
      },
    ],
  }));

  const mainAvatarStyle = useAnimatedStyle(() => ({
    opacity: mainAvatarOpacity.value,
  }));

  const showAvatar = () => {
    if (selectedBodyShape === "bae") {
      femaleOpacity.value = withTiming(0, { duration: 1000 });
    } else {
      maleOpacity.value = withTiming(0, { duration: 1000 });
    }
    setAvatarGenerated(true);
    triggerNotification("Success");
    mainAvatarOpacity.value = withTiming(1, { duration: 1000 });
    circleTextOpacity.value = withDelay(750, withTiming(1, { duration: 1000 }));
    circleTextScale.value = withDelay(750, withTiming(1, { duration: 1000 }));
    counterRotation.value = withRepeat(
      withTiming(360, { duration: 15000, easing: Easing.linear }),
      -1,
      false
    );
    rotation.value = withRepeat(
      withTiming(0, { duration: 15000, easing: Easing.linear }),
      -1,
      false
    );
  };

  const counter = useRef(0);

  const checkAvatar = useCallback(() => {
    counter.current++;
    if (counter.current > 10) {
      onSubmit();
      return;
    }
    refetchProfile()
      .then((data) => {
        if (isValidString(data.data?.avatar?.image)) {
          showAvatar();
        } else {
          setTimeout(checkAvatar, 1000);
        }
      })
      .catch((er) => {
        logAxiosError(er);
        setTimeout(checkAvatar, 1000);
      });
  }, [refetchProfile, showAvatar]);

  const prepareAvatar = () => {
    if (selectedBodyShape === "bae") {
      femaleOpacity.value = withRepeat(
        withTiming(0.5, { duration: 500, easing: Easing.linear }),
        -1,
        true
      );
    } else {
      maleOpacity.value = withRepeat(
        withTiming(0.5, { duration: 500, easing: Easing.linear }),
        -1,
        true
      );
    }
    updateProfile(
      {
        body_type: selectedBodyShape!,
      },
      {
        onSuccess: () => {
          checkAvatar();
        },
        onError: (er) => {
          logAxiosError(er);
          onSubmit();
        },
      }
    );
  };

  const handleGenerate = () => {
    setGeneratingAvatar(true);
    titleOpacity.value = withTiming(0, { duration: 100 });
    if (selectedBodyShape === "bae") {
      maleOpacity.value = withTiming(0, { duration: 100 });
      femaleTranslateY.value = withTiming(
        (Device.WINDOW_HEIGHT - top - bottom - 200) / 2 -
          shapeCoordinates.current.bae.y -
          40,
        {
          duration: 500,
        }
      );
    } else {
      femaleOpacity.value = withTiming(0, { duration: 100 });
      maleTranslateY.value = withTiming(
        (Device.WINDOW_HEIGHT - top - bottom - 200) / 2 -
          shapeCoordinates.current.bro.y,
        { duration: 500 }
      );
    }
    width.value = withTiming(200, { duration: 500 });
    height.value = withTiming(200, { duration: 500 });
    borderRadius.value = withTiming(200, { duration: 500 });
    innerCircleBorderWidth.value = withTiming(2, { duration: 250 });
    setTimeout(prepareAvatar, 500);
  };

  return (
    <Animated.View
      entering={FadeIn.delay(100).duration(150)}
      style={styles.container}
    >
      <Animated.View style={titleStyle}>
        <ZText type="Title" style={styles.text}>
          Choose your body shape, {profile?.first_name}
        </ZText>
      </Animated.View>
      {/* <Animated.Text style={[styles.text, titleStyle]}></Animated.Text> */}
      <Animated.View
        onLayout={handleLayout.bind(null, "bae")}
        style={[
          styles.shapeSelection,
          selectedBodyShape === "bae" && {
            borderColor: textPrimary,
          },
          femaleStyle,
          styles.bg,
        ]}
      >
        <AnimatedTouchableOpacity
          style={[styles.shapeSelectionButton, innerCircleStyle]}
          onPress={setSelectedBodyShape.bind(null, "bae")}
        >
          <BaseFemaleAvatar width="100%" height="100%" style={styles.avatar} />
        </AnimatedTouchableOpacity>
      </Animated.View>
      <Animated.View
        onLayout={handleLayout.bind(null, "bro")}
        style={[
          styles.shapeSelection,
          selectedBodyShape === "bro" && {
            borderColor: textPrimary,
          },
          maleStyle,
          styles.bg,
        ]}
      >
        <AnimatedTouchableOpacity
          style={[styles.shapeSelectionButton, innerCircleStyle]}
          onPress={setSelectedBodyShape.bind(null, "bro")}
        >
          <BaseMaleAvatar width="100%" height="100%" style={styles.avatar} />
        </AnimatedTouchableOpacity>
      </Animated.View>
      {selectedBodyShape === undefined || isGeneratingAvatar ? null : (
        <Button onPress={handleGenerate} style={styles.button}>
          Generate Avatar
        </Button>
      )}

      <Animated.View style={[styles.mainButton, mainAvatarStyle]}>
        <Button isDisabled={!isAvatarGenerated} onPress={onSubmit}>
          Zo Zo Zo! Let's Go
        </Button>
      </Animated.View>
      {profile ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              ...StyleSheet.absoluteFillObject,
              alignItems: "center",
              marginBottom: top + bottom / 2 + 4,
              justifyContent: "center",
            },
            mainAvatarStyle,
          ]}
        >
          <Avatar
            size={200}
            uri={profile.avatar?.image ?? ""}
            alt={profile.first_name}
          />
        </Animated.View>
      ) : null}
      <CircularText
        opacity={1}
        size={340}
        marginBottom={top + bottom / 2}
        style={circularTextStyle}
      />
      <CircularText
        opacity={0.6}
        size={550}
        marginBottom={top + bottom / 2}
        style={counterCircularTextStyle}
      />
      <CircularText
        opacity={0.4}
        size={820}
        marginBottom={top + bottom / 2}
        style={circularTextStyle}
      />
    </Animated.View>
  );
};

interface CircularTextProps {
  size: number;
  opacity: number;
  marginBottom: number;
  style: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
}

const CircularText: React.FC<CircularTextProps> = ({
  size,
  marginBottom,
  opacity,
  style,
}) => {
  const [textPrimary] = useThemeColors(["Text.Primary"]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          ...StyleSheet.absoluteFillObject,
          alignItems: "center",
          justifyContent: "center",
          marginBottom,
        },
        style,
      ]}
    >
      <Svg
        height={size}
        width={size}
        opacity={opacity}
        viewBox="0 0 300 300"
        style={{ position: "absolute" }}
      >
        <G id="circle">
          <Circle r={120} x={150} y={150} fill="none" />
        </G>
        <SVGText
          fill={textPrimary}
          fontSize="27"
          fontFamily="Rubik-Medium"
          fontWeight={500}
        >
          <TextPath href="#circle">
            Zo Zo Zo • Your Cool Avatar • Zo Zo Zo • Your Cool Avatar •
          </TextPath>
        </SVGText>
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    paddingTop: 80,
    paddingBottom: 24,
  },
  text: {
    textAlign: "center",
    width: 280,
    marginBottom: 8,
    flexShrink: 0,
  },
  shapeSelection: {
    borderRadius: 24,
    width: "100%",
    overflow: "hidden",
    marginTop: 16,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderStyle: "dashed",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  shapeSelectionButton: {
    width: "100%",
    height: "100%",
    borderRadius: 200,
    borderColor: "transparent",
    alignItems: "center",
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  button: {
    marginTop: 24,
    flexShrink: 0,
    width: "100%",
    position: "relative",
    zIndex: 4,
  },
  mainButton: {
    width: "100%",
    zIndex: 1,
    position: "absolute",
    bottom: 24,
    left: 24,
  },
  avatar: {
    position: "relative",
    top: 2,
  },
  bg: {
    backgroundColor: "#FFFFFF33",
  },
});

export default AvatarSection;
