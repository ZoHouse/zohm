import { StyleSheet, View as RNView, Linking, Platform } from "react-native";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Profile, WhereaboutsV2 } from "@/definitions/profile";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import useQuery from "@/hooks/useQuery";
import helpers from "@/utils/styles/helpers";
import { router } from "expo-router";
import { PlacesSearch, Search } from "@/components/sheets";
import useVisibilityState from "@/hooks/useVisibilityState";
import { GooglePlace } from "@/definitions/general";
import {
  getDistanceFromLatLonInKm,
  googlePlaceIdToPlaceUrl,
} from "@/utils/geo";
import { useLocation } from "@/context/LocationContext";
import { formatBalanceShort } from "@/utils/data-types/number";
import {
  SafeAreaView,
  Pressable,
  View,
  Text,
  Avatar,
  Iconz,
  AccordionItem,
  Loader,
  ThemeView,
  SmallButton,
} from "@/components/ui";
import { RowShimmer } from "./ExploreShimmer";
import constants from "@/utils/constants";
import ChatIcon from "./ChatIcon";
import ZoImage from "@/components/ui/ZoImage";
import { logAxiosError } from "@/utils/network";
import { showToast } from "@/utils/toast";
import { voidFn } from "@/utils/data-types/fn";
import { useIsActiveAppState } from "@/hooks/useAppState";
import { useReactiveRef } from "@/utils/hooks";
import { fetchAndroidLS } from "@/utils/store/geo";
import Logger from "@/utils/logger";
import useSeed from "@/utils/store/seed";
import { ApplicationSeed } from "@/definitions/auth";

enum ZoLocationStatus {
  PULL = 1,
  REFETCH = 2,
  OK = 3,
  SETTINGS = 4,
}

interface HeaderProps {
  profile: Profile;
  renderSwipeCards?: React.ReactNode;
  location: WhereaboutsV2 | null;
  setLocation: (location: WhereaboutsV2 | null) => void;
  isReloading: boolean;
}

const Header = ({
  profile,
  renderSwipeCards,
  location,
  setLocation,
  isReloading,
}: HeaderProps) => {
  const onProfilePress = useCallback(() => router.push("/profile"), []);

  useEffect(() => {
    if (profile?.pid) {
      Logger.setUserId(profile.pid);
    }
  }, [profile?.pid]);

  return (
    <SafeAreaView safeArea="top">
      <AccordionItem show={isReloading}>
        <>{isReloading ? <Loader /> : null}</>
      </AccordionItem>
      <RNView style={styles.profileContainer}>
        <Pressable onPress={onProfilePress} activeOpacity={0.8}>
          <Avatar
            size={36}
            uri={profile?.avatar.image}
            alt={profile?.first_name}
          />
        </Pressable>
        <RNView style={styles.profileInfo}>
          <Pressable onPress={onProfilePress} activeOpacity={0.8}>
            <Text type="TextHighlight">{profile?.first_name}</Text>
          </Pressable>
          <HeaderUserInfo location={location} setLocation={setLocation} />
        </RNView>
        <ChatIcon />
      </RNView>
      <RNView style={styles.searchContainer}>
        <SearchBar />
        <Map />
      </RNView>
      <AnnouncementView />
      {renderSwipeCards ? (
        <View style={styles.swipeCardsContainer}>{renderSwipeCards}</View>
      ) : null}
    </SafeAreaView>
  );
};

const HeaderUserInfo = ({
  location,
  setLocation,
}: Pick<HeaderProps, "location" | "setLocation">) => {
  const [isPlacesSearchOpen, showPlacesSearch, hidePlacesSearch] =
    useVisibilityState(false);
  const {
    createWhereAbout,
    whereabouts,
    isLoading: isLoadingPlace,
    location: deviceLocation,
    status,
  } = useLocation();
  const { data, isLoading: isLoadingCoins } = useQuery(
    "WEB3_TOKEN_AIRDROPS",
    {
      select: (data) => data.data.total_amount,
    },
    {
      path: ["summary"],
    }
  );

  const coins = useMemo(
    () => (data ? formatBalanceShort(data) + " $Zo" : undefined),
    [data]
  );
  const [isOtherLocation, setOtherLocation] = useState<boolean>(false);
  const isOtherLocationRef = useReactiveRef(isOtherLocation);
  useEffect(() => {
    if (whereabouts?.place_name && !isOtherLocationRef.current) {
      setLocation(whereabouts);
    }
  }, [whereabouts?.place_name]);

  const coinsView = useMemo(
    () => (coins ? <Text type="Subtitle">{coins}</Text> : null),
    [coins]
  );

  const placeView = useMemo(
    () => (
      <Pressable
        onPress={showPlacesSearch}
        activeOpacity={0.8}
        style={styles.rowCenter}
      >
        {location?.place_name ? (
          <Text type="Subtitle">{location.place_name} </Text>
        ) : (
          <Text type="SubtitleHighlight">Set location</Text>
        )}
        <Iconz name="downAngle" size={12} />
      </Pressable>
    ),
    [location?.place_name]
  );

  const onSelect = useCallback((place: GooglePlace) => {
    fetch(googlePlaceIdToPlaceUrl(place.place_id))
      .then((res) => res.json())
      .then(
        (placeDetails) =>
          ({
            place_ref_id: place.place_id,
            place_name: place.name,
            location: {
              long: placeDetails.result.geometry.location.lng,
              lat: placeDetails.result.geometry.location.lat,
            },
          } as WhereaboutsV2)
      )
      .then((location) => {
        setLocation(location);
        setOtherLocation(true);
      });
  }, []);

  const didProvideALP = useRef(false);
  useEffect(() => {
    if (Platform.OS === "android") {
      fetchAndroidLS().then((res) => {
        didProvideALP.current = res === "true";
      });
    }
  }, []);

  const locationStatus = useMemo(() => {
    if (deviceLocation?.coords && whereabouts?.location) {
      if (!whereabouts.place_name || !whereabouts.place_ref_id) {
        return ZoLocationStatus.PULL;
      }
      const d = getDistanceFromLatLonInKm(
        deviceLocation.coords.latitude,
        deviceLocation.coords.longitude,
        whereabouts.location.lat,
        whereabouts.location.long
      );
      if (d < 10) {
        return ZoLocationStatus.OK;
      } else {
        return ZoLocationStatus.PULL;
      }
    } else if (status?.status === "denied") {
      if (didProvideALP.current) {
        return ZoLocationStatus.REFETCH;
      }
      return ZoLocationStatus.SETTINGS;
    }
    return ZoLocationStatus.REFETCH;
  }, [deviceLocation?.coords, whereabouts, status]);

  const isProcessing = useRef(false);
  const isLiveWbFetched = useRef(false);
  const retryOnActive = useRef(false);
  const isActive = useIsActiveAppState();

  useEffect(() => {
    if (
      !isProcessing.current &&
      !isLiveWbFetched.current &&
      locationStatus === ZoLocationStatus.PULL
    ) {
      createWhereAbout()
        .catch(voidFn)
        .finally(() => {
          isLiveWbFetched.current = true;
        });
    }
  }, [locationStatus === ZoLocationStatus.PULL]);

  useEffect(() => {
    if (isActive && retryOnActive.current) {
      createWhereAbout()
        .then((value) => {
          if (value) {
            setOtherLocation(false);
          }
        })
        .catch(voidFn)
        .finally(() => (retryOnActive.current = false));
    }
  }, [isActive]);

  const listHeader = useMemo(() => {
    const title = "Use My Location";
    if (
      locationStatus === ZoLocationStatus.REFETCH ||
      locationStatus === ZoLocationStatus.PULL
    ) {
      return {
        title,
        onPress: () => {
          hidePlacesSearch();
          setOtherLocation(false);
          isProcessing.current = true;
          createWhereAbout()
            .catch((er) => {
              logAxiosError(er);
              showToast({
                message: "Something wrong happened. Please try again later",
                type: "error",
              });
            })
            .finally(() => (isProcessing.current = false));
        },
      };
    }

    if (locationStatus === ZoLocationStatus.SETTINGS) {
      return {
        title,
        onPress: () => {
          hidePlacesSearch();
          Linking.openSettings().then(() => (retryOnActive.current = true));
        },
      };
    }

    if (isOtherLocation) {
      return {
        title,
        onPress: () => {
          hidePlacesSearch();
          setOtherLocation(false);
          setLocation(whereabouts ?? null);
        },
      };
    } else {
      return undefined;
    }
  }, [whereabouts?.place_ref_id, isOtherLocation, locationStatus]);

  return isLoadingCoins || isLoadingPlace ? (
    <Animated.View key="shimmer" entering={FadeIn} exiting={FadeOut}>
      <RowShimmer />
    </Animated.View>
  ) : (
    <>
      <Animated.View key="user-info" entering={FadeIn} exiting={FadeOut}>
        <RNView style={styles.rowCenter}>
          {coinsView}
          {coins ? <Text>{" • "}</Text> : null}
          {placeView}
        </RNView>
      </Animated.View>
      {isPlacesSearchOpen && (
        <PlacesSearch
          isOpen={isPlacesSearchOpen}
          onDismiss={hidePlacesSearch}
          onSelect={onSelect}
          listHeader={listHeader}
        />
      )}
    </>
  );
};

export default Header;

const styles = StyleSheet.create({
  searchBar: {
    flex: 1,
    height: 56,
    borderRadius: 100,
    borderCurve: "continuous",
    padding: 16,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  mapContainer: {
    width: 56,
    height: 56,
    borderRadius: 100,
    borderCurve: "continuous",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    padding: 6,
  },
  videoView: {
    width: 40,
    height: 40,
    borderRadius: 100,
  },
  profileContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  profileInfo: {
    alignItems: "flex-start",
    justifyContent: "center",
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
  swipeCardsContainer: {
    width: "100%",
    height: 360,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
    zIndex: 2,
  },
  collage: {
    aspectRatio: 3 / 2,
    alignSelf: "stretch",
    borderCurve: "continuous",
    borderRadius: 24,
    overflow: "hidden",
    gap: 2,
  },
  collageRow: {
    flex: 1,
    flexDirection: "row",
    gap: 2,
  },
  collageCol1: {
    flex: 3,
    alignSelf: "stretch",
  },
  collageCol2: {
    flex: 2,
    alignSelf: "stretch",
  },
  liveDot: {
    backgroundColor: "#FFFFFF70",
    aspectRatio: 1,
    height: 32,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
  },
  liveDotSmall: {
    aspectRatio: 1,
    height: 16,
    borderRadius: 100,
    backgroundColor: "white",
  },
  live: {
    padding: 6,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  phuket: {
    fontFamily: "Kalam-Bold",
    lineHeight: undefined,
  },
  discountInfo: {
    alignSelf: "stretch",
    borderRadius: 24,
    borderCurve: "continuous",
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  phuketTitleContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    justifyContent: "center",
  },
  phuketContainer: { gap: 4, justifyContent: "center", alignItems: "center" },
  announcement: {
    gap: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginHorizontal: 24,
  },
});

const SearchBar = memo(() => {
  const [isSearchOpen, showSearch, hideSearch] = useVisibilityState(false);
  return (
    <>
      <Pressable onPress={showSearch} activeOpacity={0.8} style={helpers.flex}>
        <View background="Secondary" style={styles.searchBar}>
          <Iconz name="search" />
          <Text type="Subtitle" color="Secondary">
            Search your destination
          </Text>
        </View>
      </Pressable>
      {isSearchOpen && <Search isOpen={isSearchOpen} onDismiss={hideSearch} />}
    </>
  );
});

const Map = memo(() => {
  const onMapPress = useCallback(() => {
    router.push("/zo-map");
  }, []);

  return (
    <Pressable activeOpacity={0.8} onPress={onMapPress}>
      <View
        background="Secondary"
        style={styles.mapContainer}
        pointerEvents="none"
      >
        <ZoImage url={constants.assetURLS.earth} width={80} key={null} />
      </View>
    </Pressable>
  );
});

const Live = memo(() => {
  const opacity = useSharedValue(0.2);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.elastic(1 / 2) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const liveStyle = useMemo(
    () => [styles.liveDot, animatedStyle],
    [animatedStyle]
  );

  return (
    <ThemeView theme="Brand.Zostel" style={styles.live}>
      <Animated.View style={liveStyle}>
        <View style={styles.liveDotSmall}></View>
      </Animated.View>
      <Text type="SectionTitle" color="Light">
        LIVE
      </Text>
    </ThemeView>
  );
});

const Collage = memo(
  ({
    img1,
    img2,
    img3,
    img4,
  }: {
    img1: string;
    img2: string;
    img3: string;
    img4: string;
  }) => (
    <View style={styles.collage}>
      <View style={styles.collageRow}>
        <View style={styles.collageCol1}>
          <ZoImage url={img1} width="l" />
        </View>
        <View style={styles.collageCol2}>
          <ZoImage url={img2} width="sm" />
        </View>
      </View>
      <View style={styles.collageRow}>
        <View style={styles.collageCol2}>
          <ZoImage url={img3} width="sm" />
        </View>
        <View style={styles.collageCol1}>
          <ZoImage url={img4} width="l" />
        </View>
      </View>
    </View>
  )
);

const AnnouncementView = memo(() => {
  const seed = useSeed();
  if (seed && seed.disabled_features.includes("phuket_announcement")) {
    return null;
  }
  return <Announcement seed={seed} />;
});

const Announcement = memo(({ seed }: { seed: ApplicationSeed | null }) => {
  const [
    title,
    discountTitle,
    discountDescription,
    discountButtonText,
    img1,
    img2,
    img3,
    img4,
    propertyId,
  ] = useMemo(() => {
    let _title = "We're now in Thailand! 🎉";
    let _discountTitle = "25% Launch Discount";
    let _discountDescription = "Valid only till 31st October '25";
    let _discountButtonText = "Book Now";
    let _img1 =
      "https://proxy.cdn.zostel.com/zostel/gallery/images/ROJ8MrTkT5KbHrXfdL0Sfg/zostel-phuket-20251003074126.jpg";
    let _img2 =
      "https://proxy.cdn.zostel.com/zostel/gallery/images/ussk9ek0Q9GKWsXr7qMLLA/zostel-phuket-20251001134736.jpg";
    let _img3 =
      "https://proxy.cdn.zostel.com/zostel/gallery/images/R1GsOqkdQpeCUfOXmHhR0A/zostel-phuket-20251001134550.jpg";
    let _img4 =
      "https://proxy.cdn.zostel.com/zostel/gallery/images/GJNsmteRQnSYRQsxYsYg9w/zostel-phuket-20251001135101.jpg";
    let _propertyId = "zostel-phuket-phkh951";
    if (seed?.app_home_announcement) {
      _title = seed.app_home_announcement.title;
      _discountTitle = seed.app_home_announcement.discount_title;
      _discountDescription = seed.app_home_announcement.discount_description;
      _discountButtonText = seed.app_home_announcement.discount_button_text;
      _img1 = seed.app_home_announcement.img1;
      _img2 = seed.app_home_announcement.img2;
      _img3 = seed.app_home_announcement.img3;
      _img4 = seed.app_home_announcement.img4;
      _propertyId = seed.app_home_announcement.property_id;
    }
    return [
      _title,
      _discountTitle,
      _discountDescription,
      _discountButtonText,
      _img1,
      _img2,
      _img3,
      _img4,
      _propertyId,
    ];
  }, [seed]);

  const onAnnouncementPress = useCallback(() => {
    router.push(`/property/${propertyId}`);
  }, [propertyId]);

  return (
    <Pressable
      activeOpacity={0.8}
      onPress={onAnnouncementPress}
      style={styles.announcement}
    >
      <View style={styles.phuketContainer}>
        <Text type="TextHighlight">{title}</Text>
        <View style={styles.phuketTitleContainer}>
          <Text type="Title">
            Zostel{" "}
            <Text type="Title" style={styles.phuket} color="Brand">
              Phuket
            </Text>{" "}
            is
          </Text>
          <Live />
        </View>
      </View>
      <Collage img1={img1} img2={img2} img3={img3} img4={img4} />
      <ThemeView theme="Status.Progress" style={styles.discountInfo}>
        <RNView>
          <Text center type="SubtitleHighlight">
            {discountTitle}
          </Text>
          <Text center type="Subtitle" color="Secondary">
            {discountDescription}
          </Text>
        </RNView>
        <SmallButton onPress={onAnnouncementPress} type="fancy">
          {discountButtonText}
        </SmallButton>
      </ThemeView>
    </Pressable>
  );
});
