import { Chip, Pressable, Text } from "@/components/ui";
import { TripAvailability, TripSku } from "@/definitions/trip";
import { formatDates } from "@/utils/data-types/date";
import moment from "moment";
import { useCallback } from "react";
import { FlatList, StyleSheet } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";

interface TripDatesListProps {
  dates: TripAvailability[];
  slot: TripAvailability | null;
  duration: number;
  setSlot: (slot: TripAvailability) => void;
  skuMap: Record<string, TripSku>;
}

const TripDatesList = ({
  dates,
  slot,
  duration,
  setSlot,
  skuMap,
}: TripDatesListProps) => {
  const renderItem = useCallback(
    ({ item }: { item: TripAvailability }) => {
      return (
        <Pressable onPress={() => setSlot(item)}>
          <Chip
            stroke={
              item.date === slot?.date && item.pid === slot.pid
                ? "Selected"
                : "NonSelected"
            }
            style={styles.tripDatesItem}
            curve={12}
          >
            <Text type="TextHighlight">
              {formatDates(
                moment(item.date),
                moment(item.date).add(duration, "day")
              )}
            </Text>
            <Text type="SubtitleHighlight" color="Secondary">
              {skuMap[item.pid].name}
            </Text>
          </Chip>
        </Pressable>
      );
    },
    [slot, duration, skuMap]
  );

  return (
    <Animated.View entering={FadeInRight.delay(100)}>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.tripDatesListContent}
        horizontal
        data={dates}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => `${item.date}-${item.pid}`}
      />
    </Animated.View>
  );
};

export default TripDatesList;

const styles = StyleSheet.create({
  list: {
    marginHorizontal: -24,
  },
  tripDatesListContent: {
    paddingHorizontal: 24,
    gap: 8,
  },
  tripDatesItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
