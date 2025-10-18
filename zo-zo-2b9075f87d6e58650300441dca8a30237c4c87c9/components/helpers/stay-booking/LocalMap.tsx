import { Divider, SectionTitle, View } from "@/components/ui";
import { LegendList } from "@legendapp/list";
import { memo, useCallback } from "react";
import { StyleSheet } from "react-native";
import device from "@/config/Device";
import ZoImage from "@/components/ui/ZoImage";

const mapImageDimensions = {
  width: device.WINDOW_WIDTH - 48,
  height: (device.WINDOW_WIDTH - 48) / 0.75,
};

interface LocalMapProps<T extends { id: string; image: string }> {
  images: T[];
  heading?: string;
  hasDivider?: boolean;
}

const LocalMap = <T extends { id: string; image: string }>({
  images,
  heading,
  hasDivider = true,
}: LocalMapProps<T>) => {
  const renderItem = useCallback(({ item }: { item: T }) => {
    return (
      <View style={styles.mapImageContainer}>
        <ZoImage url={item.image} width="sm" id={`map-image-${item.id}`} />
      </View>
    );
  }, []);

  return (
    <>
      {heading && <SectionTitle noHorizontalPadding children={heading} />}
      <View>
        <LegendList
          horizontal
          pagingEnabled
          snapToInterval={mapImageDimensions.width + 8}
          decelerationRate="fast"
          data={images}
          showsHorizontalScrollIndicator={false}
          recycleItems
          contentContainerStyle={styles.mapListContent}
          keyExtractor={(item) => item.id}
          style={styles.mapListContainer}
          estimatedItemSize={mapImageDimensions.height}
          renderItem={renderItem}
        />
      </View>
      {hasDivider && <Divider marginTop={16} />}
    </>
  );
};

const styles = StyleSheet.create({
  mapImageContainer: {
    borderRadius: 12,
    borderCurve: "continuous",
    overflow: "hidden",
    width: mapImageDimensions.width,
    height: mapImageDimensions.height,
  },
  mapListContainer: {
    height: mapImageDimensions.height,
    marginHorizontal: -24,
  },
  mapListContent: {
    gap: 8,
    paddingHorizontal: 24,
  },
});

export default memo(LocalMap);
