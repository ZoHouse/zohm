import { TripStop } from "@/definitions/trip";
import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import Sheet from "../Base";
import {
  Chip,
  GradientFooter,
  Pressable,
  SafeAreaView,
  Text,
} from "@/components/ui";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import Markdown from "@/components/ui/Markdown";
import CollageView from "@/components/ui/CollageView";

type ItinerarySheetProps = {
  isOpen: boolean;
  onClose: () => void;
  itinerary: TripStop[];
  selectedDay: number;
};

const ItinerarySheet = ({
  isOpen,
  onClose,
  itinerary,
  selectedDay: selectedDayIndex,
}: ItinerarySheetProps) => {
  const [selectedDay, setSelectedDay] = useState<number>(selectedDayIndex);

  const flatListRef = useRef<FlatList>(null);

  const scrollTo = useCallback((index: number) => {
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index,
        animated: true,
        viewOffset: 48,
      });
    }, 100);
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollTo(selectedDay);
    }
  }, [isOpen, selectedDay]);

  return (
    <Sheet
      isOpen={isOpen}
      onDismiss={onClose}
      snapPoints={["90%"]}
      disableContentDragForAndroid
    >
      <SafeAreaView safeArea="bottom" style={styles.container}>
        <BottomSheetScrollView
          style={styles.flex}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          <Text style={styles.title} center type="Title">
            {itinerary[selectedDay].title}
          </Text>
          <View style={styles.gap}>
            {itinerary[selectedDay].media.length > 0 && (
              <View style={styles.collage}>
                <CollageView
                  fillType="vertical"
                  key={selectedDay}
                  images={itinerary[selectedDay].media.slice(0, 4)}
                />
              </View>
            )}
            <Markdown>{itinerary[selectedDay].description}</Markdown>
          </View>
        </BottomSheetScrollView>
      </SafeAreaView>
      <GradientFooter y={0.36} style={styles.gradient}>
        <View>
          <FlatList
            horizontal
            ref={flatListRef}
            onScrollToIndexFailed={(i) => scrollTo(i.index)}
            showsHorizontalScrollIndicator={false}
            data={itinerary}
            contentContainerStyle={styles.flatListContent}
            style={styles.flatList}
            renderItem={({ index }) => (
              <Pressable
                activeOpacity={0.8}
                onPress={() => setSelectedDay(index)}
              >
                <Chip
                  stroke={selectedDay !== index ? "NonSelected" : "Selected"}
                  style={styles.day}
                >
                  <Text type="SubtitleHighlight">Day {index + 1}</Text>
                </Chip>
              </Pressable>
            )}
          />
        </View>
      </GradientFooter>
    </Sheet>
  );
};

export default ItinerarySheet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 72,
  },
  flatList: {
    marginHorizontal: -24,
    paddingTop: 8,
  },
  contentContainer: {
    paddingBottom: 48,
  },
  flatListContent: {
    paddingVertical: 8,
    gap: 8,
    paddingHorizontal: 24,
  },
  gap: {
    gap: 16,
  },
  collage: {
    aspectRatio: 312 / 200,
  },
  day: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    borderCurve: "continuous",
  },
  title: {
    marginBottom: 24,
    marginTop: 16,
  },
  flex: {
    flex: 1,
  },
  closeBtn: { alignSelf: "flex-end", padding: 8, paddingHorizontal: 16 },
  gradient: {
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
});
