import { Pressable, Text } from "@/components/ui";
import { TripSpotlight } from "@/definitions/trip";
import useQuery from "@/hooks/useQuery";
import helpers from "@/utils/styles/helpers";
import { LegendList } from "@legendapp/list";
import moment from "moment";
import { memo, useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { getCurrenciedPrice } from "@/utils/trips";
import { router } from "expo-router";
import { SpotlightShimmer } from "./TripShimmers";
import ZoImage from "@/components/ui/ZoImage";

const gradient = ["transparent", "#00000099", "#000000"] as const;

const TripSpotlightView = () => {
  const { data, isLoading } = useQuery("TRIP_SPOTLIGHT", {
    select: (data) => data.data.inventories,
  });

  const renderItem = useCallback(
    ({ item }: { item: TripSpotlight }) => <Card item={item} />,
    []
  );

  const keyExtractor = useCallback(
    (item: TripSpotlight) => `spotlight-${item.pid}`,
    []
  );

  return (
    <View style={styles.container}>
      {!data || isLoading ? (
        <SpotlightShimmer />
      ) : (
        <Animated.View entering={FadeIn} key="spotlight-list">
          <LegendList
            horizontal
            data={data}
            style={styles.listSize}
            recycleItems
            keyExtractor={keyExtractor}
            estimatedItemSize={270}
            renderItem={renderItem}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.list}
          />
        </Animated.View>
      )}
    </View>
  );
};

const Card = memo(({ item }: { item: TripSpotlight }) => {
  const tripPrice = useMemo(
    () =>
      item.starting_price && item.currency
        ? getCurrenciedPrice(item.starting_price, item.currency, 1, 0)
        : undefined,
    [item]
  );

  const duration = useMemo(
    () =>
      // @ts-ignore
      item.itinerary?.length
        ? // @ts-ignore
          item.itinerary?.length - 1
        : item.itinerary?.duration ?? 1,
    // @ts-ignore
    [item]
  );

  const onPress = useCallback(() => {
    router.push(`/trip/${item.pid}`);
  }, [item]);

  return (
    <Pressable activeOpacity={0.8} onPress={onPress} style={styles.bigTripBox}>
      <View style={helpers.absoluteFit}>
        <ZoImage url={item.banner} width="m" id={item.pid} />
      </View>
      {item.isInternational ? (
        <View style={styles.bigTripInternationalContainer}>
          <Text type="Tertiary">International ✈️</Text>
        </View>
      ) : null}
      <View style={styles.bigTripGradien}>
        <LinearGradient colors={gradient} style={helpers.fit} />
      </View>
      <View style={helpers.fit}>
        <View style={helpers.flex} />
        <View style={styles.tripContent}>
          {duration ? (
            <View style={styles.smallTripDurationContainer}>
              <Text style={styles.white} type="Tertiary">
                {duration} Nights
              </Text>
            </View>
          ) : null}
          <Text style={styles.white} type="TextHighlight">
            {item.name}
          </Text>
          {item.batches?.length ? (
            <Text style={styles.secondaryText} type="Subtitle">
              {moment(item.batches[0]).format("DD MMM")}
            </Text>
          ) : null}
          {tripPrice ? (
            <Text style={styles.secondaryText} type="Subtitle">
              From{" "}
              <Text type="Subtitle" style={styles.white}>
                {tripPrice}/person
              </Text>
            </Text>
          ) : (
            <Text style={styles.secondaryText} type="Subtitle">
              Sold Out
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    height: 380,
    marginBottom: 38,
  },
  list: { paddingHorizontal: 24, gap: 16 },
  bigTripBox: {
    borderRadius: 16,
    borderCurve: "continuous",
    width: 270,
    height: 360,
    overflow: "hidden",
  },
  bigTripImage: {
    width: 270,
    height: 360,
  },
  bigTripGradien: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 180,
  },
  smallTripDurationContainer: {
    backgroundColor: "#111111A3",
    borderRadius: 100,
    borderCurve: "continuous",
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  white: {
    color: "white",
  },
  secondaryText: {
    color: "#FFFFFF70",
  },
  bigTripInternationalContainer: {
    backgroundColor: "white",
    borderRadius: 100,
    borderCurve: "continuous",
    paddingVertical: 6,
    paddingHorizontal: 12,
    position: "absolute",
    top: 16,
    left: 16,
  },
  tripContent: { padding: 16, paddingTop: 0 },
  loader: {
    marginTop: 64,
  },
  listSize: { height: 360 },
});

export default memo(TripSpotlightView);
