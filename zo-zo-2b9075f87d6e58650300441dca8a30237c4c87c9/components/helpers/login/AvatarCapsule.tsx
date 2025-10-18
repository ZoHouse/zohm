import { BlurView } from "expo-blur";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  LayoutChangeEvent,
  LayoutRectangle,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  runOnJS,
  SlideInUp,
  SlideOutUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Avatar from "@/components/ui/Avatar";
import Text from "@/components/ui/Text";
import { triggerFeedBack } from "@/utils/haptics";
import useMutation from "@/hooks/useMutation";
import useQuery from "@/hooks/useQuery";
import { logAxiosError } from "@/utils/network";
import helpers from "@/utils/styles/helpers";
import { Profile } from "@/definitions/profile";
import { ZoAvatarView, ZoToken, ZoTokenVideo } from "@/components/helpers/common/ZoToken";
import device from "@/config/Device";
import { useAuth } from "@/context/AuthContext";

const W = device.WINDOW_WIDTH;
const H = device.WINDOW_HEIGHT;

const AvatarCapsule = ({
  profile,
  city,
  location,
  showCoins,
  hideAvatar,
  showAvatarAnimation,
}: {
  profile: Profile;
  city?: string | undefined;
  location?: string | undefined | null;
  showCoins?: boolean;
  hideAvatar?: boolean;
  showAvatarAnimation?: boolean;
}) => {
  const { top, bottom } = useSafeAreaInsets();
  const SH = H - (top + bottom + top + 4);
  const layoutRef = useRef<LayoutRectangle | null>(null);
  const avatarWidth = useSharedValue(4);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    layoutRef.current = e.nativeEvent.layout;
  }, []);

  const shrinkToAvatar = useCallback(() => {
    if (!layoutRef.current) return;
    const duration = 500;
    const py = Math.max(8, (layoutRef.current.height - 32) / 2);
    animatedTop.value = withTiming(layoutRef.current.y + py, {
      duration,
    });
    animatedLeft.value = withTiming(-14 + layoutRef.current.x + 8, {
      duration,
    });
    animatedScale.value = withTiming(32 / 200, { duration });
    avatarWidth.value = withTiming(32, { duration });
  }, []);

  const avatarContainerStyle = useAnimatedStyle(() => ({
    width: avatarWidth.value,
  }));

  const animatedAvatar = useMemo(() => {
    return hideAvatar ? (
      <Animated.View style={[styles.smallAvatarW, avatarContainerStyle]} />
    ) : (
      <View style={styles.avatarW}>
        <Avatar size={32} uri={profile?.avatar?.image} alt={profile?.first_name} />
      </View>
    );
  }, [profile?.avatar?.image, hideAvatar]);

  const locationText = useMemo(() => {
    return location && city
      ? `📍 ${location} • 🏠 ${city}`
      : location
      ? `📍 ${location}`
      : city
      ? `🏠 ${city}`
      : null;
  }, [location, city]);

  const zoAvatarView = useMemo(
    () => (
      <Animated.View
        entering={SlideInUp.delay(200).duration(800)}
        exiting={SlideOutUp.duration(400)}
        style={[styles.avatarContainer, { paddingTop: top + 8 }]}
      >
        <View style={styles.headerRow} onLayout={onLayout}>
          <View
            style={[StyleSheet.absoluteFill, styles.blurBackground]}
            pointerEvents="none"
          >
            <BlurView
              style={StyleSheet.absoluteFill}
              tint="systemUltraThinMaterialDark"
              intensity={80}
            />
          </View>
          {animatedAvatar}
          <View>
            <Text type="SubtitleHighlight">Zo {profile?.first_name}</Text>
            <View style={styles.locationRow}>
              {locationText ? (
                <Text numberOfLines={2} type="Tertiary">
                  {safeLocationText(locationText)}
                </Text>
              ) : null}
            </View>
          </View>
          <ZoCoins hasCoinTimestampPassed={!!showCoins} />
        </View>
      </Animated.View>
    ),
    [profile, city, location, showCoins, shrinkToAvatar, animatedAvatar]
  );

  useEffect(() => {
    if (showAvatarAnimation) {
      shrinkToAvatar();
    }
  }, [showAvatarAnimation]);

  const animatedTop = useSharedValue(SH / 2 - 50);
  const animatedLeft = useSharedValue(W / 2 - 100);
  const animatedScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    top: animatedTop.value,
    left: animatedLeft.value,
    transform: [{ scale: animatedScale.value }],
  }));

  const animatedCenterAvatar = useMemo(
    () => (
      <Animated.View
        style={[
          {
            top: SH / 2 - 50,
            left: W / 2 - 100,
          },
          styles.bigAvatar,
          animatedStyle,
        ]}
      >
        <Avatar size={200} uri={profile?.avatar?.image} alt={profile?.first_name} />
      </Animated.View>
    ),
    [profile]
  );

  return (
    <>
      {zoAvatarView}
      {showAvatarAnimation && hideAvatar ? animatedCenterAvatar : null}
    </>
  );
};

const ZoCoins = ({
  hasCoinTimestampPassed,
}: {
  hasCoinTimestampPassed: boolean;
}) => {
  const { authState: { isAuthenticated } } = useAuth();
  const { data } = useQuery("ONBOARDING_GRANTS", {
    throwOnError(error, query) {
      logAxiosError(error);
      return false;
    },
    select: (data) => data?.data,
    enabled: !!isAuthenticated,
  });

  const { mutateAsync: updateGrant } = useMutation("ONBOARDING_GRANTS", {
    onError: logAxiosError,
  });

  const [showCoins, showAnimation] = useMemo(() => {
    return [
      data ? data.claimed || hasCoinTimestampPassed : false,
      data ? data.claimed === false && hasCoinTimestampPassed : false,
    ];
  }, [data, hasCoinTimestampPassed]);

  const onEnd = useCallback(() => {
    updateGrant({}, { onError: logAxiosError });
  }, []);

  useEffect(() => {
    if (hasCoinTimestampPassed && data?.claimed === false) {
      onEnd();
    }
  }, [hasCoinTimestampPassed, data?.claimed, onEnd]);

  const coins = useMemo(
    () => (data?.claimed ? data.amount : data?.available),
    [data]
  );

  return showCoins && coins ? (
    !device.isAndroid && showAnimation ? (
      <>
        <AnimatedZoCoinsView coins={coins} />
      </>
    ) : (
      <>
        <ZoCoinsView coins={coins} />
      </>
    )
  ) : (
    <></>
  );
};

const AnimatedZoCoinsView = ({ coins }: { coins: number }) => {
  const width = useSharedValue(0);
  const opacity = useSharedValue(0);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const w = coins > 999 ? 66 : coins > 99 ? 59 : 52;
    width.value = withTiming(w, { duration: 400 });
    opacity.value = withTiming(1, { duration: 400 }, () => {
      runOnJS(setAnimated)(true);
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.coinContainer, animatedStyle]}>
      <View style={styles.pw} />
      <Text type="Tertiary" numberOfLines={1} style={styles.mr}>
        {coins}
      </Text>
      <View style={styles.tokenSize}>
        {animated && <AnimatedZoTokens />}
        <ZoTokenVideo />
      </View>
      <View style={styles.pw} />
    </Animated.View>
  );
};

const ZoCoinsView = ({ coins }: { coins: number }) => (
  <View style={styles.coinContainer}>
    <View style={styles.pw} />
    <Text type="Tertiary" numberOfLines={1} style={styles.mr}>
      {coins}
    </Text>
    <View style={styles.tokenSize}>
      <ZoAvatarView />
    </View>
    <View style={styles.pw} />
  </View>
);

const AnimatedZoTokens = () => {
  return [
    [0.3, 20, 40],
    [0.4, -30, 80],
    [0.4, 40, 120],
    [0.5, -64, 160],
    [0.64, 4, 160],
    [0.6, 40, 200],
    [0.7, -30, 230],
    [1, -80, 280],
    [1.2, 20, 350],
  ].map(([scale, translateX, translateY], index) => (
    <AnimatedZoToken
      key={index}
      scale={scale}
      translateX={translateX}
      translateY={translateY}
      duration={index * 200}
    />
  ));
};

const AnimatedZoToken = ({
  scale,
  translateX,
  translateY,
  duration,
}: {
  scale: number;
  translateX: number;
  translateY: number;
  duration: number;
}) => {
  const ty = useSharedValue(translateY);
  const tx = useSharedValue(translateX);
  const sc = useSharedValue(scale);
  const opacity = useSharedValue(1);

  useEffect(() => {
    ty.value = withTiming(0, { duration });
    tx.value = withTiming(0, { duration });
    sc.value = withTiming(1 / 5, { duration }, () => {
      opacity.value = 0;
      runOnJS(triggerFeedBack)();
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: sc.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.animatedToken, animatedStyle]}>
      <ZoToken style={helpers.fit} />
    </Animated.View>
  );
};

const safeLocationText = (locationText: string) =>
  locationText.length > 40 ? locationText.split("•").join("\n") : locationText;

const styles = StyleSheet.create({
  avatarContainer: {
    width: "100%",
    left: 0,
    position: "absolute",
    top: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRow: {
    padding: 8,
    paddingRight: 16,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  smallAvatarW: {
    width: 4,
    height: 32,
  },
  avatarW: {
    width: 32,
    height: 32,
  },
  tokenSize: {
    width: 16,
    height: 16,
  },
  blurBackground: {
    borderRadius: 100,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  coinContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    borderRadius: 100,
    borderCurve: "continuous",
    backgroundColor: "gray",
  },
  pw: {
    width: 8,
  },
  mr: {
    marginRight: 4,
  },
  bigAvatar: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    transformOrigin: "top left",
  },
  animatedToken: {
    transformOrigin: "top left",
    position: "absolute",
    width: 72,
    height: 72,
  },
});

export default AvatarCapsule;
