import useQuery from "@/hooks/useQuery";
import { router, useLocalSearchParams } from "expo-router";
import Ziew from "@/components/ui/View";
import helpers from "@/utils/styles/helpers";
import { Chip, Iconz, Pressable, SafeAreaView, Text } from "@/components/ui";
import { FlatList, StyleSheet, View } from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LegendList } from "@legendapp/list";
import device from "@/config/Device";
import { Operator } from "@/definitions/discover";
import { logAxiosError } from "@/utils/network";
import { TripItinerary } from "@/definitions/trip";
import ZoImage from "@/components/ui/ZoImage";
import FullCarousel, { CarouselMedia } from "@/components/sheets/FullCarousel";
import { SearchResult } from "@/definitions/general";
import { Media } from "@/definitions/booking";
import { mediaFromItinerary } from "@/utils/trips";

const Gallery = () => {
  const { code, type, room_id } = useLocalSearchParams<{
    type: "stay" | "trip";
    code: string;
    room_id?: string;
  }>();

  const { data: operator } = useQuery(
    "STAY_OPERATORS",
    {
      enabled: type === "stay" && Boolean(code),
      select: (data) => data.data?.operator,
      throwOnError: (er) => {
        logAxiosError(er);
        return false;
      },
    },
    {
      path: [code],
    }
  );

  const { data: trip } = useQuery<
    "TRIP",
    SearchResult<TripItinerary>,
    TripItinerary[]
  >(
    "TRIP",
    {
      select: (data) => data.data.results,
      throwOnError: (er) => {
        logAxiosError(er);
        return false;
      },
      enabled: type === "trip" && Boolean(code),
    },
    {
      path: [code, "itineraries"],
    }
  );

  const rooms = useMemo(() => {
    if (type === "stay") {
      return getStayImages(operator);
    } else {
      return getTripImages(trip);
    }
  }, [operator, trip]);

  const [selectedRoom, setSelectedRoom] = useState<{
    images: CarouselMedia[];
    name: string;
    id: string;
  } | null>(null);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const renderImage = useCallback(
    ({ item, index }: { item: CarouselMedia; index: number }) => (
      <Pressable
        style={styles.imageContainer}
        onPress={() => setSelectedIndex(index)}
      >
        <ZoImage url={item.image} width="s" key={item.id} />
      </Pressable>
    ),
    []
  );
  const hListRef = useRef<FlatList>(null);

  const onPressHItem = useCallback(
    (item: (typeof rooms)[number], index: number) => {
      setSelectedRoom(item);
      hListRef.current?.scrollToIndex({
        index,
        animated: true,
        viewOffset: 24,
      });
    },
    []
  );

  useEffect(() => {
    if (rooms.length > 0) {
      const index = Math.max(
        rooms.findIndex((r) => r.id === room_id),
        0
      );
      onPressHItem(rooms[index], index);
    }
  }, [rooms.length, room_id]);

  const hListRenderItem = useCallback(
    ({ item, index }: { item: (typeof rooms)[number]; index: number }) => (
      <Pressable onPress={() => onPressHItem(item, index)} activeOpacity={0.8}>
        <Chip
          curve={100}
          stroke={item.id === selectedRoom?.id ? "Selected" : "NonSelected"}
          style={styles.hChip}
        >
          <Text type="SubtitleHighlight">{item.name}</Text>
        </Chip>
      </Pressable>
    ),
    [selectedRoom?.id]
  );

  const onFailedToScrollToIndex = useCallback(
    ({ index }: { index: number }) => {
      setTimeout(() => {
        hListRef.current?.scrollToIndex({
          index,
          animated: true,
          viewOffset: 24,
        });
      }, 100);
    },
    []
  );

  return (
    <Ziew background style={helpers.stretch}>
      <SafeAreaView safeArea="top" />
      <View style={styles.header}>
        <Iconz
          onPress={router.back}
          name="arrow-left"
          size={24}
          fillTheme="Primary"
        />
      </View>
      <View>
        <FlatList
          data={rooms}
          ref={hListRef}
          horizontal
          style={styles.hlist}
          contentContainerStyle={styles.hListContent}
          showsHorizontalScrollIndicator={false}
          renderItem={hListRenderItem}
          onScrollToIndexFailed={onFailedToScrollToIndex}
        />
      </View>
      <View style={helpers.flex}>
        <LegendList
          key={selectedRoom?.id}
          data={selectedRoom?.images ?? []}
          style={helpers.flex}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          recycleItems
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.imageListContent}
          renderItem={renderImage}
          ListFooterComponent={<SafeAreaView safeArea="bottom" />}
          estimatedItemSize={styles.imageContainer.width}
          minimumZoomScale={1}
          maximumZoomScale={2}
          pinchGestureEnabled
          zoomScale={1}
        />
      </View>
      {selectedIndex !== null && (
        <FullCarousel
          images={selectedRoom?.images ?? []}
          initialIndex={selectedIndex}
          isOpen
          onDismiss={() => setSelectedIndex(null)}
          title={selectedRoom?.name ?? ""}
        />
      )}
    </Ziew>
  );
};

export default Gallery;

const styles = StyleSheet.create({
  header: {
    minHeight: 56,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  hlist: {
    marginVertical: 8,
  },
  hListContent: { gap: 8, paddingHorizontal: 24 },
  hChip: { paddingVertical: 6, paddingHorizontal: 12 },
  imageContainer: {
    width: (device.WINDOW_WIDTH - (48 + 16)) / 2,
    aspectRatio: 1,
    borderRadius: 12,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  columnWrapper: { gap: 16 },
  imageListContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  fullImageContainer: {
    width: device.WINDOW_WIDTH,
    height: device.WINDOW_HEIGHT,
    overflow: "hidden",
  },
  carouselScroll: {
    flexGrow: 1,
    ...helpers.stretch,
  },
  carouselScrollContent: {
    flexGrow: 1,
  },
  topCarousel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  topCarouselContent: {
    height: 56,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  topCarouselTitle: {
    fontFamily: "Kalam-Bold",
    width: "100%",
  },
  bottomCarousel: {
    position: "absolute",
    bottom: 48,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomCross: {
    padding: 8,
    borderRadius: 100,
  },
  ph: {
    paddingHorizontal: 24,
  },
});

const getStayImages = (operator?: Operator) => {
  if (!operator) return [];
  const roomImages = operator.rooms.map((r) => ({
    images: r.images,
    name: r.name,
    id: String(r.id),
  }));
  roomImages?.unshift({
    images: operator.images,
    name: operator.name,
    id: `operator-${operator.code}`,
  });
  return roomImages;
};

const getTripImages = (trip?: TripItinerary[]) => {
  if (!trip) return [];
  const result: {
    name: string;
    id: string;
    images: Media[];
  }[] = [];
  trip.forEach((tr) => {
    const images = mediaFromItinerary(tr);
    if (images.length)
      result.push({
        images,
        name: tr.title,
        id: tr.pid,
      });
  });
  return result;
};
