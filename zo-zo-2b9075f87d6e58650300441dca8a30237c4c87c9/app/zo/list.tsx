import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Image } from "expo-image";
import moment from "moment";
import Animated, {
  FadeIn,
  FadeInUp,
  FadeOut,
  FadeOutUp,
  withTiming,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  FadeInDown,
} from "react-native-reanimated";
import {
  Avatar,
  GradientHeader,
  Iconz,
  Loader,
  Pressable,
  SafeAreaView,
  Text,
  View as Ziew,
} from "@/components/ui";
import { ZoToken, ZoTokenVideo } from "@/components/helpers/common";
import { useThemeColors, WithDarkTheme } from "@/context/ThemeContext";
import useProfile from "@/hooks/useProfile";
import useQuery from "@/hooks/useQuery";
import { SearchResult } from "@/definitions/general";
import { ProfileClaim } from "@/definitions/zo";
import constants from "@/utils/constants";
import { formatBalance } from "@/utils/credit";
import { formatWalletAddress } from "@/utils/data-types/number";
import { triggerFeedBack } from "@/utils/haptics";
import { logAxiosError } from "@/utils/network";
import { formatNickname } from "@/utils/profile";
import helpers from "@/utils/styles/helpers";
import { router } from "expo-router";

const StatusIcon = memo(() => {
  return (
    <Ziew background="Inputbox" style={styles.iconBgTilted}>
      <Iconz size={16} name="arrow-left" fillTheme="ViewOnly" />
    </Ziew>
  );
});

const source = {
  walletBackground: { uri: constants.assetURLS.walletBackground },
  walletCover: { uri: constants.assetURLS.walletCover },
  shine: { uri: constants.assetURLS.shine },
};

const CoinsList = () => {
  const { data: balance = 0, isLoading: isBalanceLoading } = useQuery(
    "WEB3_TOKEN_AIRDROPS",
    {
      select: (data) => data.data?.total_amount ?? 0,
      throwOnError: (er) => {
        logAxiosError(er);
        return false;
      },
    },
    {
      path: ["summary"],
    }
  );

  const { data: grants, isLoading: isProfileClaimsLoading } = useQuery<
    "PROFILE_COMPLETION_GRANTS",
    SearchResult<ProfileClaim>,
    ProfileClaim[]
  >(
    "PROFILE_COMPLETION_GRANTS",
    {
      select: (data) => data.data.results,
      throwOnError: (er) => {
        logAxiosError(er);
        return false;
      },
    },
    {
      path: ["claims"],
    }
  );

  const { profile, isLoading: isProfileLoading } = useProfile();

  const [isOpenView, setIsOpenView] = useState(false);
  const [isTitleVisible, setIsTitleVisible] = useState(false);

  const bgY = useSharedValue(0);
  const cardY = useSharedValue(0);
  const scrollY = useRef(0);
  const cardYMax = useRef(0);

  const animatedBackgroundStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bgY.value }],
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardY.value }],
  }));

  useEffect(() => {
    bgY.value = withTiming(isOpenView ? 200 + Math.max(scrollY.current, 0) : 0);
    cardY.value = withTiming(isOpenView ? -150 : 0);
  }, [isOpenView]);

  const toggleView = useCallback(() => {
    setIsOpenView((prev) => !prev);
  }, []);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollY.current = event.nativeEvent.contentOffset.y;
      setIsTitleVisible(scrollY.current > cardYMax.current - 72);
    },
    []
  );

  useEffect(() => {
    triggerFeedBack();
  }, [isTitleVisible]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    cardYMax.current =
      event.nativeEvent.layout.height + event.nativeEvent.layout.y;
  }, []);

  const isLoading =
    isBalanceLoading || isProfileLoading || isProfileClaimsLoading;

  const walletText = useMemo(
    () =>
      `${
        profile?.nickname ? `${formatNickname(profile?.nickname)}'s` : "Your"
      } wallet`,
    [profile?.nickname]
  );

  const backdrop = useMemo(
    () =>
      isOpenView ? (
        <Pressable
          onPress={toggleView}
          activeOpacity={0.8}
          style={styles.openBg}
        >
          <View />
        </Pressable>
      ) : null,
    [isOpenView]
  );

  const description = useMemo(
    () =>
      isOpenView ? (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={styles.zoDescriptionContainer}
        >
          <Text type="Subtitle" center style={styles.description}>
            Get Zo World coins as airdrop by completing quests, stay & trips.
          </Text>
        </Animated.View>
      ) : null,
    [isOpenView]
  );

  const [green, inverted] = useThemeColors(["Vibes.Green", "Text.Inverted"]);

  const gradientColors = useMemo(
    () => [inverted, inverted, `${inverted}00`],
    [inverted]
  );

  const renderItem = useCallback(
    (item: ProfileClaim, index: number) => {
      return (
        <View style={styles.txnRow} key={index}>
          <StatusIcon />
          <View style={helpers.flex}>
            <Text type="Subtitle">{item.description}</Text>
            {item.claimed_at && (
              <Text color="Secondary" type="Tertiary">
                {moment(item.claimed_at).format("DD MMM hh:mm A")}
              </Text>
            )}
          </View>
          <View style={styles.tokenContainer}>
            <Text
              style={[
                styles.textShadow,
                {
                  shadowColor: green,
                  color: green,
                },
              ]}
              type="SubtitleHighlight"
            >
              + {formatBalance(item.amount)}
            </Text>
            <ZoToken style={styles.token} />
          </View>
        </View>
      );
    },
    [green]
  );

  const navContent = useMemo(
    () => (
      <View style={styles.head}>
        <Pressable onPress={router.back}>
          <Iconz size={24} name="arrow-left" fill="white" />
        </Pressable>
        <Animated.View pointerEvents="none" style={styles.titleContainer}>
          {isTitleVisible && (
            <Animated.View entering={FadeInUp} exiting={FadeOutUp}>
              <Text type="SubtitleHighlight" style={styles.whiteText}>
                {walletText}
              </Text>
            </Animated.View>
          )}
        </Animated.View>
      </View>
    ),
    [isTitleVisible, walletText]
  );

  return (
    <Ziew background style={helpers.stretch}>
      <GradientHeader y={0.4} colors={gradientColors}>
        {navContent}
      </GradientHeader>
      <ScrollView
        contentContainerStyle={styles.list}
        onScroll={onScroll}
        style={styles.flex}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <Animated.View
            key="loader"
            entering={FadeIn}
            exiting={FadeOut}
            style={styles.loader}
          >
            <Loader />
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown} style={styles.list}>
            <SafeAreaView safeArea="bottom" />
            <View style={styles.txnContent}>{grants?.map(renderItem)}</View>
            {backdrop}
            <Pressable
              activeOpacity={0.9}
              style={styles.cardPressContainer}
              onLayout={onLayout}
              onPress={toggleView}
            >
              <Animated.View style={[styles.card, animatedBackgroundStyle]}>
                <Image
                  source={source.walletBackground}
                  contentFit="contain"
                  style={helpers.absoluteFit}
                  cachePolicy="disk"
                />
                <Animated.View
                  style={styles.cardShadow}
                  entering={FadeIn.duration(500)}
                />
                <Animated.View
                  style={[styles.cardContainer, animatedCardStyle]}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.balanceRow}>
                      <View style={styles.balanceWrapper}>
                        <Text style={styles.whiteText} type="SubtitleHighlight">
                          {formatBalance(balance)}
                        </Text>
                        <Text style={styles.grayText} type="Tertiary">
                          $Zo
                        </Text>
                      </View>
                      {/* <ZoVideo style={styles.tokenVideo} /> */}
                      <ZoTokenVideo />
                    </View>
                    <View style={styles.flex} />
                    {profile ? (
                      <View style={styles.avatarInfo}>
                        <Avatar
                          size={32}
                          uri={profile?.avatar?.image}
                          alt={profile?.first_name}
                        />
                        <View style={styles.flex}>
                          <Text type="Subtitle" style={styles.whiteText}>
                            {profile?.nickname
                              ? formatNickname(profile?.nickname)
                              : "You"}
                          </Text>
                          <Text type="Tertiary" style={styles.grayText}>
                            {formatWalletAddress(profile?.wallet_address ?? "")}
                          </Text>
                        </View>
                      </View>
                    ) : null}
                    <View style={styles.shineContainer}>
                      <MovingShine />
                    </View>
                  </View>
                </Animated.View>
                <View style={styles.cardCover}>
                  <Image
                    source={source.walletCover}
                    style={helpers.fit}
                    cachePolicy="disk"
                  />
                  <View style={styles.cardCoverTextContainer}>
                    <Text type="Subtitle" style={styles.grayText}>
                      {walletText}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            </Pressable>
            <View style={styles.bar} />
            <SafeAreaView safeArea="top" />
          </Animated.View>
        )}
      </ScrollView>
      {description}
    </Ziew>
  );
};

const MovingShine = memo(() => {
  const tx = useSharedValue(-100);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: "30deg" }, { translateX: tx.value }],
  }));

  useEffect(() => {
    tx.value = withRepeat(withTiming(420, { duration: 1500 }), -1, false);
  }, []);

  return (
    <Animated.View style={[styles.shineEffect, animatedStyle]}>
      <Image
        source={source.shine}
        style={helpers.fit}
        contentFit="cover"
        cachePolicy="disk"
      />
    </Animated.View>
  );
});

export default memo(WithDarkTheme(CoinsList));

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  bar: {
    height: 56,
  },
  head: {
    width: "100%",
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "flex-start",
  },
  list: {
    flexDirection: "column-reverse",
  },
  avatarInfo: {
    flexDirection: "row",
    gap: 8,
  },
  screen: {
    backgroundColor: "#111111",
  },
  container: {
    paddingTop: 108,
    paddingHorizontal: 24,
    flex: 1,
  },
  txnRow: {
    minHeight: 40,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardPressContainer: { padding: 24, paddingBottom: 0, paddingTop: 8 },
  screenContainer: {
    flex: 1,
    alignSelf: "stretch",
    flexDirection: "column-reverse",
  },
  zoDescriptionContainer: { position: "absolute", bottom: 140 },
  card: {
    aspectRatio: 312 / 200,
    width: "100%",
    // marginBottom: 40,
    borderRadius: 16,
    borderCurve: "continuous",
    backgroundColor: "#222222",
  },
  cardContainer: {
    margin: 24,
    flex: 1,
    alignSelf: "stretch",
    backgroundColor: "#FFFFFF3D",
    borderRadius: 12,
    borderCurve: "continuous",
    paddingBottom: 4,
  },
  tokenContainer: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  textShadow: {
    shadowRadius: 8,
    shadowOpacity: 1,
  },
  token: {
    width: 16,
    height: 16,
  },
  openBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#111",
    opacity: 0.8,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#202020",
    alignItems: "center",
    justifyContent: "center",
  },
  txnContent: {
    ...helpers.stretch,
    paddingHorizontal: 24,
    gap: 32,
    paddingBottom: 24,
    paddingTop: 40,
  },
  iconBgTilted: {
    transform: [{ rotate: "-45deg" }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#202020",
    alignItems: "center",
    justifyContent: "center",
  },
  txnDescription: {
    color: "rgba(255, 255, 255, 0.44)",
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 240,
  },
  titleContainer: {
    ...helpers.absoluteFit,
    ...helpers.center,
  },
  cardContent: {
    ...helpers.fit,
    padding: 16,
    backgroundColor: "#111111",
    borderRadius: 12,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: "#FFFFFF29",
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balanceWrapper: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  whiteText: {
    color: "white",
  },
  grayText: {
    color: "rgba(255, 255, 255, 0.44)",
  },
  tokenVideo: {
    width: 24,
    height: 24,
    borderRadius: 24,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  shineContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  shineEffect: {
    position: "absolute",
    width: 150,
    left: -60,
    top: -140,
    bottom: 0,
  },
  cardCover: {
    aspectRatio: 312 / 120,
    width: "100%",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  cardShadow: {
    width: "80%",
    height: 24,
    backgroundColor: "rgba(25, 25, 25, 1)",
    position: "absolute",
    top: "45%",
    left: "10%",
    shadowColor: "black",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 3 / 4,
    shadowRadius: 16,
    elevation: 5,
  },
  cardCoverTextContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  description: {
    paddingHorizontal: 24,
    color: "white",
  },
});
