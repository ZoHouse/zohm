import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import MapView, { Marker } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { LegendList, LegendListRef } from "@legendapp/list";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { router } from "expo-router";

import MapCardView from "@/components/helpers/map/MapCard";
import MapMarker from "@/components/helpers/map/MapMarker";
import {
  CheckBox,
  Emooji,
  Iconz,
  Loader,
  Pressable,
  SafeAreaView,
  Text,
  View as Ziew,
  BlurBackground,
} from "@/components/ui";
import { DatePicker, Sheet } from "@/components/sheets";
import { useThemeColors } from "@/context/ThemeContext";
import { useBooking } from "@/context/BookingContext";
import { useLocation } from "@/context/LocationContext";
import useProfile from "@/hooks/useProfile";
import useQuery from "@/hooks/useQuery";
import useVisibilityState from "@/hooks/useVisibilityState";
import constants from "@/utils/constants";
import device from "@/config/Device";
import helpers from "@/utils/styles/helpers";
import { entries } from "@/utils/object";
import {
  sortMarkersByDistanceFromSelectedOperator,
  toMapOperatorType,
} from "@/utils/map";
import { MapOperator } from "@/definitions/zo";
import { Profile, WhereaboutsV2 } from "@/definitions/profile";

type Anchor = { latitude: number; longitude: number };

const ZoMapScreen = () => {
  const { data, isLoading } = useQuery("ALL_STAY_OPERATOR", {
    select: (data) => toMapOperatorType(data.data.operators, []),
    staleTime: 1000 * 60 * 60 * 24 * 7,
  });

  const { data: trips, isLoading: isLoadingTrips } = useQuery(
    "BOOKINGS_TRIP",
    {
      select: (data) => toMapOperatorType([], data.data.results),
      staleTime: 1000 * 60 * 60 * 24 * 7,
    },
    {
      path: ["inventories"],
    }
  );

  const [filters, setFilters] = useState<
    Record<keyof typeof constants.map.urls, boolean>
  >(
    Object.keys(constants.map.urls).reduce(
      (ac, el) => ({ ...ac, [el]: true }),
      {} as Record<keyof typeof constants.map.urls, boolean>
    )
  );
  const toggleFilter = useCallback(
    (key: keyof typeof constants.map.urls) => {
      setFilters({ ...filters, [key]: !filters[key] });
    },
    [filters]
  );
  const [isFilterOpen, showFilter, hideFilter] = useVisibilityState(false);
  const [selectedOperator, setSelectedOperator] = useState<MapOperator | null>(
    null
  );
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const sortedOperators = useMemo(() => {
    if (!anchor) return [];
    if (!data) return [];
    return sortMarkersByDistanceFromSelectedOperator(
      data.concat(trips ?? []),
      anchor
    ).filter((el) => filters[el.type]);
  }, [anchor, data?.length, trips?.length, filters]);

  const { profile } = useProfile();
  const { whereabouts } = useLocation();

  const scrollIndex = useRef(0);
  const isScrollHandlerEnabled = useRef(true);
  const disableScrollForInstance = useCallback(() => {
    isScrollHandlerEnabled.current = false;
    setTimeout(() => {
      isScrollHandlerEnabled.current = true;
    }, 1000);
  }, []);

  const listRef = useRef<LegendListRef>(null);
  const onSelectOperator = useCallback(
    (operator: MapOperator | null) => {
      if (!operator) return;
      if (!anchor) {
        scrollIndex.current = 0;
        setAnchor(operator);
      }
      setSelectedOperator(operator);
      const targetIndex = sortedOperators.findIndex(
        (o) => o.code === operator.code
      );
      // ---
      if (targetIndex - scrollIndex.current > 10) {
        setAnchor(null);
        scrollIndex.current = 0;
        setTimeout(() => setAnchor(operator), 100);
        return;
      }
      // ---
      disableScrollForInstance();
      listRef.current?.scrollToOffset({
        offset:
          targetIndex * (constants.map.cardWidth + constants.map.cardSpacing),
        animated: true,
      });
    },
    [anchor, sortedOperators]
  );

  const mapRef = useRef<MapView>(null);
  const deltas = useRef<{
    latitudeDelta: number;
    longitudeDelta: number;
  }>({
    latitudeDelta: constants.map.latitudeDelta,
    longitudeDelta: constants.map.longitudeDelta,
  });

  useEffect(() => {
    if (!selectedOperator) return;
    mapRef.current?.animateToRegion(
      {
        latitude: selectedOperator.latitude,
        longitude: selectedOperator.longitude,
        latitudeDelta: deltas.current.latitudeDelta,
        longitudeDelta: deltas.current.longitudeDelta,
      },
      300
    );
  }, [selectedOperator?.code]);

  const keyExtractor = useCallback((item: MapOperator) => item.code, []);
  const renderItem = useCallback(({ item }: { item: MapOperator }) => {
    return <MapCardView operator={item} />;
  }, []);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!isScrollHandlerEnabled.current) return;
      const index = Math.abs(
        Math.round(
          event.nativeEvent.contentOffset.x /
            (constants.map.cardWidth + constants.map.cardSpacing)
        )
      );
      scrollIndex.current = index;
      const selected = sortedOperators[index];
      if (selected) {
        setSelectedOperator(selected);
      }
    },
    [sortedOperators]
  );

  const [primary] = useThemeColors(["Background.Primary"]);
  const [gradientColors, headGradient] = useMemo(
    () => [
      [`${primary}00`, primary] as const,
      [primary, `${primary}CC`, `${primary}00`] as const,
    ],
    [primary]
  );

  const filteredStayMarkers = useMemo(() => {
    if (!data) return [];
    return data.filter((el) => filters[el.type]);
  }, [data, filters]);

  const filteredTripMarkers = useMemo(() => {
    if (!trips) return [];
    return trips.filter((el) => filters[el.type]);
  }, [trips, filters]);

  const onCityPress = useCallback(() => {
    if (!profile?.home_location?.lat || !profile?.home_location?.lng) return;
    setAnchor(null);
    setSelectedOperator(null);
    mapRef.current?.animateToRegion({
      latitude: profile?.home_location?.lat,
      longitude: profile?.home_location?.lng,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1 * device.ASPECT_RATIO,
    });
  }, [profile?.home_location]);
  const onLocationPress = useCallback(() => {
    if (!whereabouts?.location) return;
    setAnchor(null);
    setSelectedOperator(null);
    mapRef.current?.animateToRegion({
      latitude: whereabouts.location.lat,
      longitude: whereabouts.location.long,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1 * device.ASPECT_RATIO,
    });
  }, [whereabouts?.location]);

  const onCross = useCallback(() => {
    setAnchor(null);
    setSelectedOperator(null);
  }, []);

  const onResetMap = useCallback(() => {
    setAnchor(null);
    setSelectedOperator(null);
    mapRef.current?.animateToRegion(constants.map.countryInitialRegion);
  }, []);

  return (
    <Ziew background style={helpers.stretch}>
      <MapView
        style={helpers.stretch}
        initialRegion={constants.map.countryInitialRegion}
        customMapStyle={constants.map.mapStyle}
        ref={mapRef}
        rotateEnabled={false}
      >
        {filteredStayMarkers?.map((operator) => (
          <MapMarker
            key={operator.code}
            operator={operator}
            selected={operator.code === selectedOperator?.code}
            setSelectedOperator={onSelectOperator}
          />
        ))}
        {filteredTripMarkers?.map((trip) => (
          <MapMarker
            key={trip.code}
            operator={trip}
            selected={trip.code === selectedOperator?.code}
            setSelectedOperator={onSelectOperator}
          />
        ))}
        {profile && whereabouts ? (
          <SelfMarkers profile={profile} whereabouts={whereabouts} />
        ) : null}
      </MapView>
      {sortedOperators.length > 0 ? (
        <SafeAreaView safeArea="bottom" style={styles.bottomList}>
          <LegendList
            horizontal
            recycleItems
            data={sortedOperators}
            renderItem={renderItem}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            decelerationRate="fast"
            onScroll={onScroll}
            estimatedItemSize={constants.map.cardWidth}
            ref={listRef}
            snapToInterval={constants.map.cardWidth + constants.map.cardSpacing}
            keyExtractor={keyExtractor}
          />
          <Pressable style={styles.cross} onPress={onCross}>
            <BlurBackground intensity={100} />
            <Iconz name="cross" size={24} fillTheme="Primary" />
          </Pressable>
        </SafeAreaView>
      ) : null}
      <SafeAreaView safeArea="top" style={styles.topArea}>
        <LinearGradient
          style={helpers.absoluteFit}
          colors={headGradient}
          start={start}
          end={end}
          pointerEvents="none"
        />
        <View style={styles.topAreaContent}>
          <Pressable style={styles.backButton} onPress={router.back}>
            <Iconz name="arrow-left" size={24} />
          </Pressable>
          <View style={styles.headContent}>
            <View style={styles.headIcons}>
              <MapDatePicker />
              <Pressable
                activeOpacity={0.8}
                onPress={showFilter}
                style={styles.headIcon}
              >
                <BlurBackground />
                <Iconz
                  name="filter"
                  size={16}
                  fillTheme="Primary"
                  onPress={showFilter}
                />
              </Pressable>
              <Pressable
                activeOpacity={0.8}
                onPress={onResetMap}
                style={styles.headIcon}
              >
                <BlurBackground />
                <Iconz
                  name="resetMap"
                  size={16}
                  fillTheme="Primary"
                  onPress={onResetMap}
                />
              </Pressable>
            </View>
            {profile?.place_name || whereabouts?.place_name ? (
              <View style={styles.locations}>
                {profile?.place_name ? (
                  <Pressable
                    style={styles.chip}
                    activeOpacity={0.8}
                    onPress={onCityPress}
                  >
                    <BlurBackground />
                    <Text type="Tertiary">🏠 {profile?.place_name}</Text>
                  </Pressable>
                ) : null}
                {whereabouts?.place_name ? (
                  <Pressable
                    style={styles.chip}
                    activeOpacity={0.8}
                    onPress={onLocationPress}
                  >
                    <BlurBackground />
                    <Text type="Tertiary">📍 {whereabouts?.place_name}</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
      <SafeAreaView safeArea="bottom" style={styles.bottomArea}>
        <LinearGradient
          style={helpers.absoluteFit}
          colors={gradientColors}
          pointerEvents="none"
        />
      </SafeAreaView>
      {isFilterOpen ? (
        <MapFilters
          isOpen={isFilterOpen}
          onClose={hideFilter}
          filters={filters}
          setFilters={toggleFilter}
        />
      ) : null}
      {isLoading || isLoadingTrips ? (
        <Loading
          isLoading={isLoading}
          isLoadingTrips={isLoadingTrips}
          gradientColors={gradientColors}
        />
      ) : null}
    </Ziew>
  );
};

export default ZoMapScreen;

const SelfMarkers = memo(
  ({
    profile,
    whereabouts,
  }: {
    profile: Profile;
    whereabouts: WhereaboutsV2;
  }) => {
    const cityCoords = useMemo(
      () =>
        profile?.home_location?.lat && profile?.home_location?.lng
          ? {
              latitude: profile.home_location.lat,
              longitude: profile.home_location.lng,
            }
          : null,
      [profile?.home_location]
    );

    const whereAboutCoords = useMemo(
      () =>
        whereabouts?.location
          ? {
              latitude: whereabouts.location.lat,
              longitude: whereabouts.location.long,
            }
          : null,
      [whereabouts]
    );

    return (
      <>
        {whereAboutCoords ? (
          <Marker coordinate={whereAboutCoords} zIndex={100000}>
            <Emooji size={24} children="📍" />
          </Marker>
        ) : null}
        {cityCoords ? (
          <Marker coordinate={cityCoords} zIndex={100000}>
            <Emooji size={24} children="🏠" />
          </Marker>
        ) : null}
      </>
    );
  }
);

const Loading = memo(
  ({
    isLoading,
    isLoadingTrips,
    gradientColors,
  }: {
    isLoading: boolean;
    isLoadingTrips: boolean;
    gradientColors: readonly [string, string];
  }) => (
    <Animated.View
      entering={FadeInDown}
      exiting={FadeOutDown}
      key="loader"
      style={styles.loading}
    >
      <LinearGradient
        style={helpers.absoluteFit}
        colors={gradientColors}
        pointerEvents="none"
      />
      <Loader height={42} width={42} />
      <Text type="Subtitle">
        {isLoadingTrips && isLoading
          ? "Fetching Stays and Trips..."
          : isLoadingTrips
          ? "Fetching Trips..."
          : "Fetching Stays..."}
      </Text>
    </Animated.View>
  )
);

const styles = StyleSheet.create({
  bottomList: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
  },
  bottomListContent: {
    height: constants.map.cardHeight,
  },
  list: {
    height: constants.map.cardHeight,
  },
  listContent: {
    gap: constants.map.cardSpacing,
    paddingHorizontal: 24,
  },
  topArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  topAreaContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 56,
  },
  backButton: {
    paddingHorizontal: 24,
    height: "100%",
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderCurve: "continuous",
    overflow: "hidden",
    position: "relative",
  },
  locations: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingRight: 24,
  },
  headIcons: {
    paddingRight: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headIcon: {
    padding: 8,
    borderRadius: 12,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  headContent: { gap: 6, alignItems: "flex-end" },
  bottomArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 16,
  },
  filterContent: {
    flex: 1,
    gap: 16,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 16,
  },
  filterImage: {
    width: 24,
    height: 24,
  },
  filterText: {
    textTransform: "capitalize",
    flex: 1,
  },
  filterTitle: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  cross: {
    position: "absolute",
    top: -48,
    right: 8,
    padding: 8,
    borderRadius: 100,
    overflow: "hidden",
  },
  background: {
    ...helpers.absoluteFit,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  datePicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  loading: {
    position: "absolute",
    bottom: 0,
    paddingBottom: 42,
    paddingTop: 32,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});

const start = { x: 0.5, y: 0.4 };
const end = { x: 0.5, y: 1 };

interface MapFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Record<keyof typeof constants.map.urls, boolean>;
  setFilters: (key: keyof typeof constants.map.urls) => void;
}

const MapFilters = memo(
  ({ isOpen, onClose, filters, setFilters }: MapFiltersProps) => {
    return (
      <Sheet
        isOpen={isOpen}
        onDismiss={onClose}
        enableDynamicSizing
        maxDynamicContentSize={700}
        backgroundComponent={Background}
      >
        <BottomSheetView style={helpers.stretch}>
          <Text type="SectionTitle" style={styles.filterTitle}>
            Filters
          </Text>
          <SafeAreaView safeArea="bottom" style={styles.filterContent}>
            {entries(constants.map.urls).map(([key, value]) => (
              <Pressable
                activeOpacity={0.8}
                style={styles.filterRow}
                key={key}
                onPress={() => setFilters(key)}
              >
                <Image
                  source={{ uri: value }}
                  style={styles.filterImage}
                  contentFit="contain"
                  cachePolicy="disk"
                />
                <Text type="Paragraph" style={styles.filterText}>
                  {key.replace("-", " ")}
                </Text>
                <CheckBox isSelected={Boolean(filters[key])} size={24} />
              </Pressable>
            ))}
          </SafeAreaView>
        </BottomSheetView>
      </Sheet>
    );
  }
);

const Background = memo(() => (
  <BlurBackground intensity={80} style={styles.background} />
));

const MapDatePicker = memo(() => {
  const { startDate, endDate } = useBooking();
  const [isOpen, show, hide] = useVisibilityState(false);
  return (
    <>
      <Pressable activeOpacity={0.8} style={styles.datePicker} onPress={show}>
        <BlurBackground />
        <Iconz name="calendar" size={16} fillTheme="Primary" />
        <Text type="Subtitle">
          {startDate.format("DD MMM")} - {endDate.format("DD MMM")}
        </Text>
      </Pressable>
      {isOpen ? <DatePicker isOpen={isOpen} onClose={hide} /> : null}
    </>
  );
});
