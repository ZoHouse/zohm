import TripCarousel from "@/components/helpers/trip/TripCarousel";
import TripDatesList from "@/components/helpers/trip/TripDatesList";
import TripFooter from "@/components/helpers/trip/TripFooter";
import TripInfo from "@/components/helpers/trip/TripInfo";
import { TripInfoShimmer } from "@/components/helpers/trip/TripShimmers";
import {
  GradientHeader,
  Iconz,
  Pressable,
  SafeAreaView,
  SectionTitle,
} from "@/components/ui";
import Text from "@/components/ui/Text";
import Ziew from "@/components/ui/View";
import { useThemeColors } from "@/context/ThemeContext";
import { TripItinerary } from "@/definitions/trip";
import useTrips from "@/hooks/useTrips";
import { useTripResetState } from "@/utils/store/trip";
import helpers from "@/utils/styles/helpers";
import { mediaFromItinerary } from "@/utils/trips";
import { router, useLocalSearchParams } from "expo-router";
import moment from "moment";
import React, { useCallback, useEffect, useMemo } from "react";
import { FlatList, ScrollView, Share, StyleSheet, View } from "react-native";

const TripDetailScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const {
    duration,
    pricing,
    slot,
    setSlot,
    isLoading,
    tripData,
    trip,
    selectedItinerary,
    selectItineraryId,
    itineraries,
    slots,
    skuMap,
  } = useTrips(id);

  useEffect(() => {
    if (itineraries?.length) {
      selectItineraryId(itineraries[0].pid);
    }
  }, [itineraries?.length]);

  useEffect(() => {
    if (slots.length) {
      setSlot(slots[0]);
    } else {
      setSlot(null);
    }
  }, [slots]);

  const onShare = useCallback(() => {
    if (!id || !tripData?.availability.length || !slot) return;
    const url = `https://www.zostel.com/trips/${id}?date=${moment(
      slot.date
    ).format("DD-MM-YYYY")}`;
    const message = `Hey, I found this amazing trip on Zostel: ${url}`;
    Share.share({
      message,
    });
  }, [id, tripData?.availability, slot]);

  const resetTripState = useTripResetState();

  useEffect(() => {
    resetTripState();
  }, []);

  const onBook = useCallback(() => {
    if (!slot?.pid || !selectedItinerary?.pid) return;
    router.push(`/trip/${id}/select?sku=${slot.pid}&date=${slot.date}`);
  }, [slot]);

  const [brandColor] = useThemeColors(["Background.Zostel"]);

  const renderBatch = useCallback(
    ({ item }: { item: TripItinerary }) => (
      <Pressable
        activeOpacity={0.8}
        onPress={() => selectItineraryId(item.pid)}
      >
        <View
          style={[
            styles.batch,
            {
              borderBottomColor:
                selectedItinerary?.pid === item.pid
                  ? brandColor
                  : "transparent",
            },
          ]}
        >
          <Text
            color={selectedItinerary?.pid === item.pid ? "Brand" : "Primary"}
            type="TextHighlight"
          >
            {item.title}
          </Text>
        </View>
      </Pressable>
    ),
    [selectedItinerary?.pid, brandColor]
  );

  const tripMedia = useMemo(
    () => (!selectedItinerary ? [] : mediaFromItinerary(selectedItinerary)),
    [selectedItinerary]
  );

  return (
    <Ziew background style={helpers.stretch}>
      <GradientHeader y={0.64}>
        <View style={styles.nav}>
          <Iconz
            name="arrow-left"
            size={24}
            fillTheme="Primary"
            onPress={router.back}
          />
          <Iconz name="share" size={24} fillTheme="Primary" onPress={onShare} />
        </View>
      </GradientHeader>
      {isLoading ? (
        <TripInfoShimmer />
      ) : !trip ? null : (
        <ScrollView
          style={helpers.stretch}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <SafeAreaView safeArea="top" />
          <View style={styles.head} />
          <View style={styles.content}>
            <SectionTitle type="Title" noHorizontalPadding>
              {trip.name}
            </SectionTitle>
            <View style={styles.listContents}>
              {tripMedia.length ? (
                <View style={styles.carouselContainer}>
                  <TripCarousel
                    media={tripMedia}
                    pid={trip.pid}
                  />
                </View>
              ) : null}
              {trip.skus.length ? (
                <View>
                  <Ziew background="Secondary" style={styles.batchesStroke} />
                  <FlatList
                    data={itineraries}
                    style={styles.batches}
                    renderItem={renderBatch}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.batchList}
                  />
                </View>
              ) : null}
              {trip && slots?.length ? (
                <View style={styles.tripDatesListContainer}>
                  <TripDatesList
                    dates={slots}
                    slot={slot}
                    duration={duration - 1}
                    setSlot={setSlot}
                    skuMap={skuMap}
                  />
                </View>
              ) : (
                <View />
              )}
            </View>
            <TripInfo
              aboutSheet
              cancellation_policies={trip.cancellation_policies}
              description={selectedItinerary?.description ?? ""}
              destinations={trip.destinations}
              drop_location={selectedItinerary?.drop_location ?? ""}
              pickup_location={selectedItinerary?.pickup_location ?? ""}
              essentials={selectedItinerary?.essentials ?? []}
              exclusions={selectedItinerary?.exclusions ?? []}
              faqs={selectedItinerary?.faqs ?? []}
              guest_policies={selectedItinerary?.policies ?? []}
              highlights={selectedItinerary?.highlights ?? []}
              inclusions={selectedItinerary?.inclusions ?? []}
              stops={selectedItinerary?.stops ?? []}
              local_map={trip.local_map}
            />
          </View>
          <SafeAreaView safeArea="bottom" />
        </ScrollView>
      )}
      {pricing && trip && slot && selectedItinerary && (
        <TripFooter
          pricing={pricing}
          trip={trip}
          slot={slot}
          onBook={onBook}
          isSoldOut={slot.units === 0 || !slot.sellable}
          duration={selectedItinerary.duration}
          itinerary={selectedItinerary}
        />
      )}
    </Ziew>
  );
};

export default TripDetailScreen;

const styles = StyleSheet.create({
  nav: {
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    paddingHorizontal: 24,
    height: 56,
  },
  batches: {
    marginHorizontal: -24,
  },
  batchList: {
    gap: 24,
    paddingHorizontal: 24,
  },
  batch: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  listContents: { gap: 16, marginBottom: 8 },
  content: {
    flex: 1,
    alignSelf: "stretch",
    paddingTop: 8,
    gap: 8,
  },
  contentContainer: {
    flexGrow: 1,
    alignSelf: "stretch",
    paddingBottom: 120,
    paddingHorizontal: 24,
  },
  tripDatesListContainer: {
    alignSelf: "stretch",
    marginBottom: 12,
  },
  carouselContainer: {
    borderRadius: 16,
    overflow: "hidden",
    borderCurve: "continuous",
  },
  head: {
    height: 56,
  },
  batchesStroke: {
    alignSelf: "stretch",
    height: 2,
    position: "absolute",
    bottom: 0,
    left: -24,
    right: -24,
  },
});
