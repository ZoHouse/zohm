import React, { memo, useCallback, useMemo } from "react";
import { Share, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  BlurBackground,
  Chip,
  GradientHeader,
  Iconz,
  Pressable,
  RenderHTMLText,
  SafeAreaView,
  Text,
  View as Ziew,
} from "@/components/ui";
import { Destination, Operator } from "@/definitions/discover";
import useQuery from "@/hooks/useQuery";
import helpers from "@/utils/styles/helpers";
import constants from "@/utils/constants";
import { toMapOperatorType } from "@/utils/map";
import ZoImage from "@/components/ui/ZoImage";
import { LegendList } from "@legendapp/list";
import { LinearGradient } from "expo-linear-gradient";
import { checkIfSoldOut, minPrice } from "@/utils/stay";
import { formatDateForServer } from "@/utils/data-types/date";
import { useBooking } from "@/context/BookingContext";
import { useCurrency } from "@/context/CurrencyContext";
import colors from "@/config/colors.json";
import { TripSearchItem } from "@/definitions/trip";
import { joinArrayOfStringsTillLimit } from "@/utils/data-types/string";
import moment from "moment";
import { getCurrenciedPrice } from "@/utils/trips";
import { ZoCurrency } from "@/definitions/booking";
import DatePickerSheet from "@/components/sheets/DatePicker";
import useVisibilityState from "@/hooks/useVisibilityState";
import { Sheet } from "@/components/sheets";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import ZoMap from "@/components/helpers/map/ZoMap";
import DestinationShimmer from "@/components/helpers/desination/DestinationShimmer";

const DestinationDetailScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: destination } = useQuery<
    "STAY_DESTINATIONS",
    { destination: Destination },
    Destination
  >(
    "STAY_DESTINATIONS",
    {
      select: (data) => data.data.destination,
    },
    {
      path: [id],
    }
  );

  const { data: trips } = useQuery(
    "BOOKINGS_TRIP",
    {
      select: (data) => data.data.results,
    },
    {
      path: ["inventories", "find"],
      search: {
        destinations: id,
      },
    }
  );

  const onShare = useCallback(() => {
    if (!destination) return;
    const message = `I found this wonderful place we could go to next. 😎 Check out Zostel stays around ${destination.name}.\nhttps://www.zostel.com/zostel/${id}?utm_source=app-share&utm_medium=app-share`;

    Share.share({
      message,
    });
  }, [destination?.name]);

  const coverImage = useMemo(
    () =>
      !destination
        ? ""
        : destination?.cover_image_mobile || destination?.cover_image,
    [destination]
  );

  const items = useMemo(() => {
    const result: (
      | { type: "title"; title: string; subtitle: string; key: string }
      | { type: "stay"; stay: Operator; key: string }
      | { type: "trip"; trip: TripSearchItem; key: string }
      | { type: "dash"; key: string }
    )[] = [];

    if (destination?.operators.length) {
      result.push({
        type: "title",
        title: "Stays in " + destination.name,
        subtitle: "Trusted by millions of us",
        key: "stays",
      });
      result.push(
        ...destination.operators.map((operator) => ({
          type: "stay" as const,
          stay: operator,
          key: operator.code,
        }))
      );
    }
    if (trips && trips.length) {
      result.push({
        type: "title",
        title: "Trips Nearby",
        subtitle: "Most Loved, Experiential",
        key: "trips",
      });
      result.push(
        ...trips.map((trip) => ({
          type: "trip" as const,
          trip,
          key: trip.pid,
        }))
      );
    }
    result.push({ type: "dash", key: "dash" });
    return result;
  }, [destination?.operators, trips?.length]);

  const keyExtractor = useCallback(
    (item: (typeof items)[number]) => item.key,
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: (typeof items)[number] }) => {
      if (item.type === "title") {
        return (
          <View style={styles.titleBar}>
            <Text center type="SectionTitle">
              {item.title}
            </Text>
            <Text center type="Tertiary" color="Secondary">
              {item.subtitle}
            </Text>
          </View>
        );
      } else if (item.type === "stay") {
        return <DListItem item={item.stay} />;
      } else if (item.type === "trip") {
        return <DTripItem item={item.trip} />;
      } else if (item.type === "dash") {
        return <View />;
      }
    },
    []
  );

  const head = useMemo(
    () =>
      !destination ? null : (
        <SafeAreaView safeArea="top">
          <View style={styles.head} />
          <View style={styles.headContent}>
            <View style={styles.cover}>
              <ZoImage url={coverImage} width="l" />
            </View>
            <Text center style={styles.title}>
              Welcome to {destination.name}
            </Text>
            <Text
              center
              type="Subtitle"
              color="Secondary"
              style={styles.subtitle}
            >
              {destination.short_description}
            </Text>
            {destination.tags?.length ? (
              <View style={styles.tags}>
                {destination.tags.map((tag) => (
                  <Chip
                    key={tag.slug}
                    background="Secondary"
                    style={styles.tag}
                    curve={100}
                  >
                    <Text type="Subtitle">
                      {tag.emoji}
                      {"  "}
                      {tag.title ?? tag.slug}
                    </Text>
                  </Chip>
                ))}
              </View>
            ) : null}
          </View>
        </SafeAreaView>
      ),
    [destination]
  );

  const footer = useMemo(
    () => (
      <SafeAreaView safeArea="bottom">
        <View style={styles.foot} />
      </SafeAreaView>
    ),
    []
  );

  if (!destination) {
    return (
      <Ziew background style={helpers.stretch}>
        <SafeAreaView safeArea="top">
          <View style={styles.head} />
        </SafeAreaView>
        <DestinationShimmer />
        <GradientHeader>
          <View style={styles.head}>
            <Iconz
              name="arrow-left"
              size={24}
              fillTheme="Primary"
              onPress={router.back}
            />
          </View>
        </GradientHeader>
      </Ziew>
    );
  }

  return (
    <Ziew background style={helpers.stretch}>
      <LegendList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        ListHeaderComponent={head}
        ListFooterComponent={footer}
        recycleItems
        showsVerticalScrollIndicator={false}
      />
      <GradientHeader>
        <View style={styles.head}>
          <Iconz
            name="arrow-left"
            size={24}
            fillTheme="Primary"
            onPress={router.back}
          />
          <Iconz name="share" size={24} fillTheme="Primary" onPress={onShare} />
        </View>
      </GradientHeader>
      {destination ? (
        <DestinationActions destination={destination} trips={trips ?? []} />
      ) : null}
    </Ziew>
  );
};

export default DestinationDetailScreen;

const styles = StyleSheet.create({
  cover: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 24,
    borderCurve: "continuous",
    overflow: "hidden",
    marginTop: 8,
  },
  titleBar: { marginVertical: 16, marginBottom: -4 },
  headContent: { gap: 16, marginBottom: 16 },
  content: { paddingHorizontal: 24, gap: 16 },
  tag: {
    flexDirection: "row",
    gap: 4,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  hListContent: {
    paddingHorizontal: 24,
    gap: constants.map.cardSpacing,
  },
  title: {
    fontFamily: "Kalam-Bold",
    fontSize: 32,
    lineHeight: undefined,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontFamily: "Kalam-Bold",
    fontSize: 24,
    lineHeight: undefined,
  },
  subtitle: {
    marginTop: -8,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  head: {
    height: 56,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  card: {
    alignSelf: "stretch",
    aspectRatio: 4 / 3,
    borderRadius: 16,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  light: {
    color: colors.dark.Text.Secondary,
  },
  foot: {
    height: 120,
  },
  fab: {
    position: "absolute",
    bottom: 8,
    right: 24,
    alignItems: "flex-end",
    gap: 8,
  },
  fabContent: {
    borderRadius: 100,
    overflow: "hidden",
    borderCurve: "continuous",
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  aboutContent: {
    paddingHorizontal: 24,
    gap: 16,
    paddingVertical: 16,
  },
  cardInfo: { padding: 16, ...helpers.stretch },
  mapClose: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  mapCross: {
    padding: 8,
  },
});

const DListItem = memo(({ item }: { item: Operator }) => {
  const { startDate, endDate } = useBooking();
  const { formatCurrency } = useCurrency();

  const { data: stayInfo } = useQuery(
    "STAY_AVAILABILITY",
    {
      select: (data) => {
        const isSoldOut = checkIfSoldOut(data.data.availability);
        if (!isSoldOut) {
          const price = minPrice(data.data.pricing);
          return { type: "p", price } as const;
        } else {
          return { type: "s" } as const;
        }
      },
    },
    {
      search: {
        checkin: formatDateForServer(startDate),
        checkout: formatDateForServer(endDate),
        property_code: item.code,
      },
    }
  );

  const onPress = useCallback(() => {
    router.push(`/property/${item.code}`);
  }, [item]);

  return (
    <Pressable activeOpacity={0.9} onPress={onPress} style={styles.card}>
      <View style={helpers.absoluteEnds}>
        <ZoImage url={item.images[0].image} width="m" />
      </View>
      <DGradient />
      <View style={styles.cardInfo}>
        <View style={helpers.flex} />
        <Text type="TextHighlight" color="Light">
          {item.name}
        </Text>
        {stayInfo ? (
          stayInfo.type === "p" ? (
            <Text style={styles.light} type="Subtitle">
              Starting from{" "}
              <Text color="Light" type="SubtitleHighlight">
                {formatCurrency(stayInfo.price)}
              </Text>
            </Text>
          ) : (
            <Text style={styles.light} type="Subtitle">
              Sold Out
            </Text>
          )
        ) : null}
      </View>
    </Pressable>
  );
});

const DGradient = memo(() => {
  const gradientBottom = useMemo(
    () =>
      [
        `#11111100`,
        `#11111100`,
        `#11111100`,
        `#111111CC`,
        "#111111F2",
      ] as const,
    []
  );
  return <LinearGradient style={helpers.absoluteFit} colors={gradientBottom} />;
});

const DTripItem = memo(({ item }: { item: TripSearchItem }) => {
  const [batchString, tripPrice] = useMemo(() => {
    if (!item.batches?.length) {
      return ["Sold Out", null];
    }
    return [
      joinArrayOfStringsTillLimit(
        item.batches?.map((b) => moment(b).format("DD MMM")) || [],
        2
      ),
      item.price && item.currency
        ? getCurrenciedPrice(item.price, item.currency as ZoCurrency, 1, 0)
        : null,
    ];
  }, [item]);

  const onPress = useCallback(() => {
    router.push(`/trip/${item.pid}`);
  }, [item]);

  return (
    <Pressable activeOpacity={0.9} onPress={onPress} style={styles.card}>
      <View style={helpers.absoluteEnds}>
        <ZoImage
          url={(item.itinerary.media[0] ?? item.media[0])?.url}
          width="m"
        />
      </View>
      <DGradient />
      <View style={styles.cardInfo}>
        <View style={helpers.flex} />
        <Text type="TextHighlight" color="Light">
          {item.name}
        </Text>
        {batchString ? (
          <Text style={styles.light} type="Subtitle">
            {batchString}
          </Text>
        ) : null}
        {tripPrice ? (
          <Text style={styles.light} type="Tertiary">
            From{" "}
            <Text color="Light" type="TertiaryHighlight">
              {tripPrice}
            </Text>
            /person
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
});

const DestinationActions = memo(
  ({
    destination,
    trips,
  }: {
    destination: Destination;
    trips: TripSearchItem[];
  }) => {
    const { startDate, endDate } = useBooking();
    const [isOpenDP, showDP, hideDP] = useVisibilityState(false);
    const [isOpenMap, showMap, hideMap] = useVisibilityState(false);
    const [isOpenInfo, showInfo, hideInfo] = useVisibilityState(false);

    return (
      <SafeAreaView safeArea="bottom" style={styles.fab}>
        {destination.description ? (
          <View style={styles.fabContent}>
            <BlurBackground intensity={100} />
            <Pressable activeOpacity={0.9} onPress={showInfo}>
              <Text type="TextHighlight"> ℹ️ Info</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.fabContent}>
          <BlurBackground intensity={100} />
          <Pressable activeOpacity={0.9} onPress={showMap}>
            <Text type="TextHighlight"> 🗺️ Map</Text>
          </Pressable>
        </View>
        <View style={styles.fabContent}>
          <BlurBackground intensity={100} />
          <Pressable activeOpacity={0.9} onPress={showDP}>
            <Text type="TextHighlight">
              {" "}
              📅 {startDate.format("DD MMM")} → {endDate.format("DD MMM")}
            </Text>
          </Pressable>
        </View>
        {isOpenDP && (
          <DatePickerSheet isOpen={isOpenDP} onClose={hideDP} onSave={hideDP} />
        )}
        {isOpenInfo && (
          <DInfoSheet
            isOpen={isOpenInfo}
            onClose={hideInfo}
            destination={destination}
          />
        )}
        {isOpenMap && (
          <DMap
            isOpen={isOpenMap}
            onClose={hideMap}
            destination={destination}
            trips={trips}
          />
        )}
      </SafeAreaView>
    );
  }
);

const DInfoSheet = ({
  isOpen,
  onClose,
  destination,
}: {
  isOpen: boolean;
  onClose: () => void;
  destination: Destination;
}) => {
  return (
    <Sheet snapPoints={["75%"]} isOpen={isOpen} onDismiss={onClose}>
      <BottomSheetScrollView contentContainerStyle={styles.aboutContent}>
        <Text center type="Title">
          About {destination.name}
        </Text>
        <RenderHTMLText html={destination.description ?? ""} type="Subtitle" />
        <SafeAreaView safeArea="bottom"></SafeAreaView>
      </BottomSheetScrollView>
    </Sheet>
  );
};

const DMap = ({
  isOpen,
  onClose,
  destination,
  trips,
}: {
  isOpen: boolean;
  onClose: () => void;
  destination: Destination;
  trips: TripSearchItem[];
}) => {
  const initialRegion = useMemo(
    () => ({
      latitude: destination?.latitude,
      longitude: destination?.longitude,
      latitudeDelta: constants.map.latitudeDelta,
      longitudeDelta: constants.map.longitudeDelta,
    }),
    [destination]
  );

  const mapOperators = useMemo(
    () =>
      destination ? toMapOperatorType(destination.operators, trips ?? []) : [],
    [destination?.operators, trips]
  );

  return (
    <Sheet
      isOpen={isOpen}
      onDismiss={onClose}
      hideHandle
      fullScreen
      enablePanDownToClose={false}
      enableContentPanningGesture={false}
    >
      <View style={helpers.stretch}>
        <ZoMap
          operators={mapOperators}
          initialRegion={initialRegion!}
          onSelect={onClose}
          inSheet
        />
        <Pressable onPress={onClose} style={styles.mapClose}>
          <SafeAreaView safeArea="top" />
          <Chip curve={100} background="Primary" style={styles.mapCross}>
            <Iconz
              name="cross"
              size={24}
              fillTheme="Primary"
              onPress={onClose}
            />
          </Chip>
        </Pressable>
      </View>
    </Sheet>
  );
};
