import { Track } from "@/definitions/explore";
import { FlashList, ViewToken } from "@shopify/flash-list";
import { useCallback, useMemo, useState } from "react";
import { FlatList, LayoutChangeEvent, StyleSheet, View } from "react-native";
import TrackItem from "./TrackItem";

interface StandardHorizontalListProps<T extends Track> {
  data: T[];
  portrait?: boolean;
  isVisible: boolean;
}

const DIMENSIONS = {
  item: { width: 232, height: 200 },
  portrait: { width: 232, height: 348 },
  badge: {
    container: { width: 24, height: 24 },
    icon: { width: 12, height: 12 },
  },
} as const;

const StandardHorizontalList = <T extends Track>({
  data,
  portrait,
  isVisible,
}: StandardHorizontalListProps<T>) => {
  const size = portrait ? DIMENSIONS.portrait : DIMENSIONS.item;
  const [visibleIndex, setVisibleIndex] = useState<number>(-1);

  const renderItem = useCallback(
    ({ item, index }: { item: T; index: number }) => {
      const _isVisible = isVisible && visibleIndex === index;
      return <TrackItem track={item} size={size} isVisible={_isVisible} />;
    },
    [size, isVisible, visibleIndex]
  );

  const keyExtractor = useCallback((item: T) => {
    return item.id;
  }, []);

  const feedData = useMemo(() => {
    return data.slice(0, 10);
  }, [data]);

  const viewableItemsConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 80,
      minimumViewTime: 300,
    }),
    []
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      return;
      setVisibleIndex(
        viewableItems.find((item) => item.isViewable)?.index ?? -1
      );
    },
    []
  );

  return (
    <View style={styles.container}>
      <FlashList
        data={feedData}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        estimatedItemSize={DIMENSIONS.item.width + 16}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.list}
        viewabilityConfig={viewableItemsConfig}
        onViewableItemsChanged={onViewableItemsChanged}
      />
    </View>
  );
};

export default StandardHorizontalList;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  list: {
    paddingLeft: 24,
    paddingRight: 8,
  },
});
