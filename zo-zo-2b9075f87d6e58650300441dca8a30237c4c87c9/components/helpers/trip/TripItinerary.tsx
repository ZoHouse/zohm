import { Iconz, Pressable, Text } from "@/components/ui";
import { useThemeColors } from "@/context/ThemeContext";
import { TripStop } from "@/definitions/trip";
import { LegendList } from "@legendapp/list";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import ItinerarySheet from "@/components/sheets/trips/Itinerary";
import ZoImage from "@/components/ui/ZoImage";
import { useLocalSearchParams } from "expo-router";

interface TripItineraryProps {
  itinerary: TripStop[];
}

const TripItinerarySection = ({ itinerary }: TripItineraryProps) => {
  const [dark] = useThemeColors(["Vibes.Dark"]);

  const colors = useMemo(() => {
    return [`${dark}00`, dark] as const;
  }, [dark]);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState<number | null>(
    null
  );

  const keyExtractor = useCallback(
    (itinerary: TripStop, index: number) => `${itinerary.day}-${index}`,
    []
  );

  const { itinerary_day } = useLocalSearchParams<{ itinerary_day: string }>();

  useEffect(() => {
    const day = Number(itinerary_day);
    if (day > 0 && itinerary.length) {
      setSelectedSheetIndex(day - 1);
    }
  }, [itinerary_day, itinerary.length]);

  return (
    <>
      <LegendList
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.negativeHMargin}
        contentContainerStyle={styles.itineraryListContent}
        data={itinerary}
        estimatedItemSize={232}
        keyExtractor={keyExtractor}
        renderItem={({ item, index }) => (
          <Pressable
            activeOpacity={0.9}
            style={styles.itineraryItem}
            onPress={() => setSelectedSheetIndex(index)}
          >
            <View style={styles.image}>
              <ZoImage url={item.media?.[0]?.image} width="sm" />
            </View>
            <LinearGradient colors={colors} style={styles.itineraryGradient} />
            <View style={styles.itineraryTexts}>
              <Text center type="SubtitleHighlight" color="Light">
                DAY {index + 1}
              </Text>
              <Text center type="Subtitle" color="Light">
                {item.title}
              </Text>
            </View>
            <View style={styles.itineraryInfo}>
              <Iconz name="info" size={16} fill="white" />
            </View>
          </Pressable>
        )}
      />
      {selectedSheetIndex !== null ? (
        <ItinerarySheet
          isOpen={selectedSheetIndex !== null}
          onClose={() => setSelectedSheetIndex(null)}
          itinerary={itinerary}
          selectedDay={selectedSheetIndex ?? 0}
        />
      ) : null}
    </>
  );
};

export default TripItinerarySection;

const styles = StyleSheet.create({
  itineraryTexts: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    gap: 8,
  },
  itineraryGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "50%",
  },
  itineraryItem: {
    width: 232,
    aspectRatio: 232 / 320,
    borderRadius: 16,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  itineraryInfo: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  negativeHMargin: {
    marginHorizontal: -24,
    height: 320,
  },
  itineraryListContent: {
    paddingHorizontal: 24,
    gap: 16,
  },
  image: { width: 232, height: 320 },
});
