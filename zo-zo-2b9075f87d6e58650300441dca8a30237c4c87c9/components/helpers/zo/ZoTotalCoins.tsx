import { memo, useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import useQueryApi from "@/hooks/useQuery";
import Animated, { useAnimatedStyle, withDelay } from "react-native-reanimated";
import { runOnJS } from "react-native-reanimated";
import { withTiming } from "react-native-reanimated";
import { useSharedValue } from "react-native-reanimated";
import { Pressable, Text } from "@/components/ui";
import { ZoToken, ZoTokenVideo } from "@/components/helpers/common";
import { triggerFeedBack } from "@/utils/haptics";
import helpers from "@/utils/styles/helpers";
import { logAxiosError } from "@/utils/network";
import { formatBalanceShort } from "@/utils/data-types/number";
import { useRouter } from "expo-router";

const COIN_VALUES = [
  [1.3, -20, 40],
  [1.4, 20, 50],
  [1.6, -4, 70],
  [1.7, 20, 100],
  [1.8, -15, 110],
  [1.9, -40, 90],
];

const INIT_DELAY = 60;
const DURATION = 150;

const CoinsView = memo(({ balance }: { balance: number }) => {
  const router = useRouter();

  const onPress = useCallback(() => {
    router.push("/zo/list");
  }, [router]);

  return (
    <Pressable style={styles.coinView} onPress={onPress}>
      <Text type="Subtitle" style={styles.whiteText}>
        {formatBalanceShort(balance)}
      </Text>
      <ZoTokenVideo />
    </Pressable>
  );
});

const AnimatedZoTokens = memo(() => {
  return COIN_VALUES.map(([scale, translateX, translateY], index) => (
    <AnimatedZoToken
      key={index}
      scale={scale}
      translateX={translateX}
      translateY={translateY}
      duration={(1 + index) * DURATION}
    />
  ));
});

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
    setTimeout(() => {
      ty.value = withTiming(0, { duration });
      tx.value = withTiming(0, { duration });
      opacity.value = withDelay(
        duration * 0.4,
        withTiming(0, { duration: duration * 0.6 })
      );
      sc.value = withTiming(1 / 2, { duration }, () => {
        runOnJS(triggerFeedBack)("Light");
      });
    }, INIT_DELAY);
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
    <Animated.View style={[styles.coin, animatedStyle]}>
      <ZoToken style={helpers.fit} />
    </Animated.View>
  );
};

const AnimatedCoinsView = memo(({ balance }: { balance: number }) => {
  const count = useRef(0);
  const [showAnimation, setShowAnimation] = useState(false);
  const [balanceText, setBalanceText] = useState(balance);

  useEffect(() => {
    count.current++;
    if (count.current === 1) {
      setBalanceText(balance);
      return;
    }
    setTimeout(() => {
      setBalanceText(balance);
    }, 600);
    setShowAnimation(true);
    setTimeout(() => {
      setShowAnimation(false);
    }, COIN_VALUES.length * DURATION + INIT_DELAY);
  }, [balance]);

  const router = useRouter();

  const onPress = useCallback(() => {
    router.push("/zo/list");
  }, [router]);

  return (
    <Pressable style={styles.coinView} onPress={onPress}>
      <Text type="Subtitle" style={styles.whiteText}>
        {formatBalanceShort(balanceText)}
      </Text>
      <View>
        {showAnimation && <AnimatedZoTokens />}
        {/* <ZoTokenVideo /> */}
        <ZoToken style={styles.coinSize} />
      </View>
    </Pressable>
  );
});

const HomeCoins = memo(({ animate }: { animate?: boolean }) => {
  const { data: balance } = useQueryApi(
    "WEB3_TOKEN_AIRDROPS",
    {
      select: (data) => data.data.total_amount,
      throwOnError: (er) => {
        logAxiosError(er);
        return false;
      },
    },
    {
      path: ["summary"],
    }
  );

  if (balance === undefined) {
    return null;
  }
  if (animate) {
    return <AnimatedCoinsView balance={balance ?? 0} />;
  }
  return <CoinsView balance={balance ?? 0} />;
});

export default HomeCoins;

const styles = StyleSheet.create({
  coinView: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    flexDirection: "row",
    borderRadius: 100,
    borderCurve: "continuous",
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center",
  },
  whiteText: { color: "white" },
  coin: {
    width: 16,
    height: 16,
    position: "absolute",
  },
  coinSize: {
    width: 16,
    height: 16,
  },
});
