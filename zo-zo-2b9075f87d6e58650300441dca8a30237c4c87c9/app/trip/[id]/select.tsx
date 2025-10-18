import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Counter } from "@/components/helpers/stay";
import {
  View as Ziew,
  Text,
  Iconz,
  SafeAreaView,
  SectionTitle,
  Divider,
  Button,
  AccordionItem,
} from "@/components/ui";
import AnimatedArrow from "@/components/ui/AnimatedArrow";
import RadioFields from "@/components/ui/RadioFields";
import useTrips from "@/hooks/useTrips";
import { formatDates } from "@/utils/data-types/date";
import { useReactiveRef, useToggleState } from "@/utils/hooks";
import helpers from "@/utils/styles/helpers";
import { getCurrenciedPrice } from "@/utils/trips";
import { router, useLocalSearchParams } from "expo-router";
import moment from "moment";
import { voidFn } from "@/utils/data-types/fn";
import { TripAvailability } from "@/definitions/trip";

const Select = () => {
  const {
    id,
    date,
    sku: skuId,
  } = useLocalSearchParams<{
    id: string;
    date: string;
    sku: string;
  }>();

  const {
    slot,
    setSlot,
    trip,
    wholePriceMap,
    wholeAvailabilityMap,
    duration,
    skuMap,
    itineraries,
    selectedItinerary,
    slots,
    itinerarySkuMap,
    selectItineraryId,
  } = useTrips(id, skuId);

  const [guestCount, setGuestCount] = useState(1);
  const guestCountRef = useReactiveRef(guestCount);

  const skuOptions = useMemo(() => {
    return trip?.currency
      ? itineraries?.map((it) => {
          return {
            id: it.pid,
            title: "",
            subContent: (
              <View>
                <Text>
                  {it.title}
                  <Text type="Subtitle" color="Secondary">
                    {" • "}
                    {it.duration - 1}N/{it.duration}D
                  </Text>
                </Text>
                <Text type="Tertiary" color="Secondary">
                  {it.short_description}
                </Text>
              </View>
            ),
          };
        }) ?? []
      : [];
  }, [trip?.skus.length]);

  const [isItineraryVisible, toggleItinerary] = useToggleState(true);
  const [isDatesVisible, toggleDates] = useToggleState(true);

  const batches = useMemo(
    () =>
      trip?.currency && selectedItinerary?.pid
        ? slots.map((av) => {
            const priceMap = wholePriceMap[av.pid];
            const availability = wholeAvailabilityMap[av.pid][av.date];
            const priceText = getCurrenciedPrice(
              priceMap[av.date].price,
              trip.currency
            );
            const batch = skuMap[av.pid].name;
            return {
              id: `${av.date}-${av.pid}`,
              skuId: av.pid,
              date: av.date,
              emoji: "🗓️",
              title: "",
              subContent: (
                <View>
                  <Text>
                    {formatDates(
                      moment(av.date),
                      moment(av.date).add(Math.max(duration - 1, 1), "day")
                    )}
                    <Text color="Secondary">
                      {" • "}
                      {batch}
                    </Text>
                  </Text>
                  {availability.units ? (
                    <Text color="Secondary" type="Subtitle">
                      {priceText}/person • {availability.units} seat
                      {availability.units > 1 ? "s" : ""} left
                    </Text>
                  ) : (
                    <View style={styles.renderSubtitle}>
                      <Text type="Subtitle" color="Secondary">
                        {priceText}/person{" • "}
                      </Text>
                      <Text type="SubtitleHighlight" color="Success">
                        Booked
                      </Text>
                    </View>
                  )}
                </View>
              ),
              disabled: !availability.units,
            };
          })
        : [],
    [
      slots,
      wholePriceMap,
      wholeAvailabilityMap,
      selectedItinerary?.pid,
      trip?.currency,
    ]
  );

  const onSelectSlot = useCallback(
    ({ date, skuId }: { id: string; date: string; skuId: string }) => {
      const slot = wholeAvailabilityMap[skuId]?.[date];
      if (slot) {
        setSlot(slot);
      }
    },
    [wholeAvailabilityMap]
  );

  const findAndSetValidSlot = useCallback((list: TripAvailability[]) => {
    const validSlot = list.find((s) => s.sellable && s.units) ?? null;
    setSlot(validSlot);
  }, []);

  const isArgSlotSelected = useRef(false);
  useEffect(() => {
    if (selectedItinerary?.pid && slots.length) {
      if (!isArgSlotSelected.current) {
        isArgSlotSelected.current = true;
        const slot = slots.find((s) => s.date === date && s.pid === skuId);
        if (slot?.sellable && slot.units) {
          setSlot(slot);
        } else {
          findAndSetValidSlot(slots);
        }
      } else {
        findAndSetValidSlot(slots);
      }
    }
  }, [selectedItinerary?.pid, slots]);

  useEffect(() => {
    if (slot && slot.units < guestCountRef.current) {
      setGuestCount(Math.max(1, slot.units));
    }
  }, [slot?.date]);

  const onAddGuestInfo = useCallback(() => {
    if (slot?.pid && slot?.date && guestCount) {
      router.push(
        `/trip/${id}/add-guests?sku=${slot.pid}&date=${slot.date}&guests=${guestCount}`
      );
    }
  }, [slot, guestCount]);

  const availableUnits = slot?.units ?? 0;

  return (
    <Ziew background style={helpers.stretch}>
      <SafeAreaView safeArea="top" />
      <View style={styles.header}>
        <Iconz
          name="arrow-left"
          size={24}
          fillTheme="Primary"
          onPress={router.back}
        />
      </View>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        <SectionTitle type="Title" noHorizontalPadding>
          Confirm Info
        </SectionTitle>
        <View style={styles.gap} />
        <SectionTitle
          noHorizontalPadding
          onPress={toggleItinerary}
          content={<AnimatedArrow isDown={isItineraryVisible} size={24} />}
        >
          Trip Itinerary
        </SectionTitle>
        <AccordionItem show={isItineraryVisible}>
          <View style={helpers.wFit}>
            <RadioFields
              items={skuOptions}
              onSelect={selectItineraryId}
              selected={selectedItinerary?.pid}
              style={styles.radio}
              itemStyle={styles.radioItem}
            />
          </View>
        </AccordionItem>
        <Divider marginTop={8} marginBottom={8} />
        <View style={styles.gap} />
        <SectionTitle
          noHorizontalPadding
          onPress={toggleDates}
          content={<AnimatedArrow isDown={isDatesVisible} size={24} />}
        >
          Trip Dates
        </SectionTitle>
        <AccordionItem show={isDatesVisible}>
          <View style={helpers.wFit}>
            <RadioFields
              items={batches}
              onSelectItem={onSelectSlot}
              onSelect={voidFn}
              selected={slot ? `${slot.date}-${slot.pid}` : undefined}
              style={styles.radio}
              itemStyle={styles.radioItem}
            />
          </View>
        </AccordionItem>
        {slot?.units && slot?.sellable && batches.length ? (
          <>
            <Divider marginTop={8} marginBottom={8} />
            <View style={styles.guestSelection}>
              <Text type="SectionTitle">No. of Guests</Text>
              <Counter
                count={guestCount}
                setCount={setGuestCount}
                max={availableUnits ?? 4}
                min={1}
              />
            </View>
          </>
        ) : null}
      </ScrollView>
      <View style={styles.button}>
        <Button
          isDisabled={availableUnits < 1 || guestCount < 1 || !batches.length}
          onPress={onAddGuestInfo}
        >
          Add Guest Info
        </Button>
      </View>
      <SafeAreaView safeArea="bottom" />
    </Ziew>
  );
};

export default Select;

const styles = StyleSheet.create({
  guestSelection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  screen: {
    ...helpers.stretch,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    height: 56,
  },
  inputContainer: {
    paddingVertical: 8,
    gap: 16,
  },
  dashedBorder: {
    marginVertical: 8,
  },
  radio: { marginVertical: 8 },
  radioItem: {
    minHeight: 56,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 8,
    paddingBottom: 72,
  },
  button: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    justifyContent: "flex-end",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  renderSubtitle: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  list: {
    paddingBottom: 16,
  },
  gap: {
    height: 8,
  },
});
