import device from "@/config/Device";
import { Room } from "@/definitions/discover";
import { LegendList } from "@legendapp/list";
import React, { useCallback, useMemo, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from "react-native";
import ZoImage, { ZoImageProps } from "../../ui/ZoImage";
import Text from "@/components/ui/Text";
import Ziew from "@/components/ui/View";
import { Pressable } from "@/components/ui";

type ImageType = { id: string; image: string };
interface RoomCardCarouselProps<T extends ImageType> {
  images: T[];
  aspectRatio?: number;
  w?: ZoImageProps["width"];
  onPress?: (index: number) => void;
}

const width = device.WINDOW_WIDTH - 48;

const RoomCardCarousel = <T extends ImageType>({
  images,
  aspectRatio = 312 / 156,
  w = device.WINDOW_WIDTH,
  onPress,
}: RoomCardCarouselProps<T>) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { containerStyle, imageStyle } = useMemo(() => {
    return {
      containerStyle: {
        width,
        aspectRatio,
      },
      imageStyle: {
        width,
        aspectRatio,
      },
    };
  }, [aspectRatio]);

  const renderItem = useCallback(
    ({ item, index }: { item: T; index: number }) => {
      const handlePress = () => {
        if (onPress) {
          onPress(index);
        }
      };
      return (
        <Pressable
          disabled={!Boolean(onPress)}
          activeOpacity={0.8}
          onPress={handlePress}
          style={imageStyle}
        >
          <ZoImage url={item.image} id={item.id} width={w} />
        </Pressable>
      );
    },
    []
  );

  const keyExtractor = useCallback((item: T, index: number) => `${item.id}-${index}`, []);

  const indicator = useMemo(() => {
    return (
      <View style={styles.indicator}>
        <Ziew style={styles.chip} background="Primary">
          <Text type="TertiaryHighlight">
            {selectedIndex + 1} / {images.length}
          </Text>
        </Ziew>
      </View>
    );
  }, [images.length, selectedIndex]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset } = event.nativeEvent;
      const index = Math.min(
        Math.max(0, Math.round(contentOffset.x / width)),
        images.length - 1
      );
      setSelectedIndex(index);
    },
    [images.length]
  );

  return (
    <View style={containerStyle}>
      <LegendList
        horizontal
        data={images}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        estimatedItemSize={width}
        showsHorizontalScrollIndicator={false}
        recycleItems
        pagingEnabled
        decelerationRate="fast"
        snapToInterval={width}
        bounces={false}
        onScroll={onScroll}
      />
      {indicator}
    </View>
  );
};

export default RoomCardCarousel;

const styles = StyleSheet.create({
  //   container: {
  //     width,
  //     aspectRatio: 312 / 156,
  //   },
  //   imageContainer: {
  //     width,
  //     aspectRatio: 312 / 156,
  //   },
  indicator: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    borderRadius: 100,
    borderCurve: "continuous",
  },
});
