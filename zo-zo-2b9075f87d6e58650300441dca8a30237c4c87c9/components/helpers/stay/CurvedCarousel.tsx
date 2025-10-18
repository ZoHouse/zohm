import React, { memo, useCallback, useMemo } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  SharedValue,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { LegendList } from "@legendapp/list";
import ZoImage from "../../ui/ZoImage";

const { width } = Dimensions.get("screen");

interface CarouselItemProps {
  item: { image: string; id: string };
  index: number;
  scrollX: SharedValue<number>;
}

const ITEM_WIDTH = 264;
const ITEM_HEIGHT = 300;
const END_MARGIN = (width - ITEM_WIDTH) / 2;

const CarouselItem: React.FC<CarouselItemProps> = memo(
  ({ item, index, scrollX }) => {
    const inputRange = [
      (index - 1) * ITEM_WIDTH - END_MARGIN,
      index * ITEM_WIDTH,
      (index + 1) * ITEM_WIDTH + END_MARGIN,
    ];

    const animatedStyle = useAnimatedStyle(() => {
      const rotate = interpolate(
        scrollX.value,
        inputRange,
        [24, 0, -24],
        "clamp"
      );

      if (Platform.OS === "android") {
        const translateY = interpolate(
          scrollX.value,
          inputRange,
          [0, -80, 0],
          "clamp"
        );

        return {
          transform: [{ translateY }, { rotate: `${rotate}deg` }],
        };
      }

      const progress = interpolate(
        scrollX.value,
        inputRange,
        [0, 1 / 2, 0],
        "clamp"
      );

      const translateY = -Math.sin(progress * Math.PI) * 80;

      return {
        transform: [{ translateY }, { rotate: `${rotate}deg` }],
      };
    });

    const imgStyle = useMemo(
      () => [styles.carouselItem, animatedStyle, { zIndex: 10 - index }],
      [animatedStyle, index]
    );

    return (
      <Animated.View style={imgStyle}>
        <View style={styles.carouselImage}>
          <ZoImage url={item.image} id={item.id} width="sm" />
        </View>
      </Animated.View>
    );
  }
);

interface CurvedCarouselProps {
  list: { image: string; id: string }[];
  onPress?: (index: number) => void;
}

const CurvedCarousel: React.FC<CurvedCarouselProps> = ({ list, onPress }) => {
  const scrollX = useSharedValue(0);

  const scrollHandler = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollX.value = event.nativeEvent.contentOffset.x;
    },
    []
  );

  const renderItem = useCallback(
    ({ item, index }: { item: CarouselItemProps["item"]; index: number }) => {
      return (
        <CarouselItem
          key={item.id}
          item={item}
          index={index}
          scrollX={scrollX}
        />
      );
    },
    []
  );

  return (
    <View style={styles.container}>
      <LegendList
        data={list}
        horizontal
        renderItem={renderItem}
        pagingEnabled
        recycleItems
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={ITEM_WIDTH}
        contentContainerStyle={styles.scrollViewContent}
        onScroll={scrollHandler}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    aspectRatio: 1,
  },
  carouselImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  carouselItem: {
    alignSelf: "stretch",
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    borderRadius: 16,
    borderCurve: "continuous",
    shadowColor: "#000",
    shadowOpacity: 1 / 4,
    shadowOffset: { width: 4, height: 8 },
    shadowRadius: 8,
    elevation: 2,
    marginTop: 90,
  },
  scrollViewContent: {
    paddingLeft: END_MARGIN,
    paddingRight: END_MARGIN,
  },
});

export default memo(CurvedCarousel);
