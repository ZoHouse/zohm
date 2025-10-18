import { memo, useCallback, useMemo } from "react";
import moment from "moment";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { TripInventory } from "@/definitions/trip";
import { joinArrayOfStringsTillLimit } from "@/utils/data-types/string";
import { getCurrenciedPrice } from "@/utils/trips";
import { Pressable, Text } from "@/components/ui";
import helpers from "@/utils/styles/helpers";
import { router } from "expo-router";
import ZoImage from "@/components/ui/ZoImage";

interface TripRowProps {
  trip: TripInventory;
}

const TripRow = ({ trip }: TripRowProps) => {
  const batchesText = useMemo(
    () =>
      !trip.starting_availability
        ? ""
        : joinArrayOfStringsTillLimit(
            trip.batches?.map((batch) =>
              moment(batch, "YYYY-MM-DD").format("DD MMM")
            ) ?? [],
            3
          ),
    [trip.batches]
  );

  const tripPrice = useMemo(
    () => !trip.starting_price ? undefined : getCurrenciedPrice(trip.starting_price, trip.currency, 1, 0),
    [trip]
  );

  const onPress = useCallback(
    (day?: number) => {
      const qp = day ? `?itinerary_day=${day}` : "";
      router.push(`/trip/${trip.slug}${qp}`);
    },
    [trip.slug]
  );

  const onTitlePress = useCallback(() => {
    router.push(`/trip/${trip.slug}`);
  }, [trip.slug]);

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.container}>
      <TripRowCard trip={trip} onPress={onPress} />
      <Pressable activeOpacity={0.8} onPress={onTitlePress} style={styles.info}>
        <Text type="SectionTitle">{trip.name}</Text>
        <Text color="Secondary" type="Subtitle">
          {batchesText || "Sold Out"}
        </Text>
        {trip.starting_availability && trip.starting_price ? (
          <Text style={styles.price} color="Secondary" type="Subtitle">
            From{" "}
            <Text color="Primary" type="Subtitle">
              {tripPrice}
            </Text>
            /person
          </Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
};

interface TripRowCardProps {
  trip: TripInventory;
  onPress: () => void;
}

const TripRowCard = ({ trip, onPress }: TripRowCardProps) => {
  return (
    <Pressable onPress={onPress} activeOpacity={0.8} style={styles.tripBox}>
      <View style={helpers.absoluteFit}>
        <ZoImage url={trip.media?.[0]?.image} width="m" id={trip.pid} />
      </View>

      <View style={styles.tripContainer}>
        <View>
          {trip.is_international && (
            <View style={styles.tripInternationalContainer}>
              <Text color="Dark" type="Tertiary">
                International ✈️
              </Text>
            </View>
          )}
        </View>
        <View>
          <View style={styles.tripDurationContainer}>
            <Text style={styles.white} type="Tertiary">
              {trip.duration - 1} Nights
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default memo(TripRow);

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  info: {},
  price: { marginTop: 4 },
  white: {
    color: "white",
  },
  tripBox: {
    width: "100%",
    aspectRatio: 3 / 2,
    borderRadius: 16,
    borderCurve: "continuous",
    overflow: "hidden",
    marginRight: 16,
    alignSelf: "stretch",
  },
  tripContainer: {
    flex: 1,
    justifyContent: "space-between",
    alignSelf: "stretch",
    padding: 12,
    alignItems: "flex-start",
  },
  tripInternationalContainer: {
    backgroundColor: "white",
    borderRadius: 100,
    borderCurve: "continuous",
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tripDurationContainer: {
    backgroundColor: "#111111A3",
    borderRadius: 100,
    borderCurve: "continuous",
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
});
