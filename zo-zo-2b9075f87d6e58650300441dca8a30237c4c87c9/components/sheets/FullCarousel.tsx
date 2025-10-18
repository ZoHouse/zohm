import { LegendList, LegendListRef } from "@legendapp/list";
import { useCallback, useEffect, useRef, useState } from "react";
import { Sheet } from ".";
import { Chip, Iconz, Pressable, SafeAreaView, Text, ThemeView } from "../ui";
import helpers from "@/utils/styles/helpers";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from "react-native";
import ZoImage, { ShimmerType } from "../ui/ZoImage";
import device from "@/config/Device";
import { WithDarkTheme } from "@/context/ThemeContext";
import Animated, { FadeIn } from "react-native-reanimated";

export type CarouselMedia = {
  image: string;
  id: string;
  alt_text?: string;
  metadata?: { title?: string };
};

interface FullCarouselProps {
  images: CarouselMedia[];
  initialIndex?: number;
  isOpen: boolean;
  onDismiss: () => void;
  title: string;
}

const FullCarousel = ({
  images,
  initialIndex,
  isOpen,
  onDismiss,
  title,
}: FullCarouselProps) => {
  const renderImage = useCallback(
    ({ item }: { item: CarouselMedia }) => <CarouselItem item={item} />,
    []
  );

  const ref = useRef<LegendListRef>(null);

  useEffect(() => {
    if (initialIndex) {
      setTimeout(() => {
        ref.current?.scrollToIndex({ index: initialIndex, animated: true });
      }, 100);
    }
  }, [initialIndex]);

  const [index, setIndex] = useState(0);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset } = event.nativeEvent;
      const index = Math.min(
        Math.max(0, Math.round(contentOffset.x / device.WINDOW_WIDTH)),
        images.length - 1
      );
      setIndex(index);
    },
    [images.length]
  );

  return (
    <ThemeView theme="Vibes.Dark" style={helpers.stretch}>
      <LegendList
        horizontal
        data={images}
        style={helpers.stretch}
        renderItem={renderImage}
        estimatedItemSize={styles.fullImageContainer.width}
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={styles.fullImageContainer.width}
        ref={ref}
        nestedScrollEnabled
        onScroll={onScroll}
      />
      <View style={styles.bottomCarousel}>
        <Pressable onPress={onDismiss} activeOpacity={0.8}>
          <ThemeView theme="Vibes.White" style={styles.bottomCross}>
            <Iconz name="cross" size={24} theme="Vibes.Dark" />
          </ThemeView>
        </Pressable>
      </View>
      <SafeAreaView safeArea="top" style={styles.topCarousel}>
        <Animated.View
          style={styles.topCarouselContent}
          entering={FadeIn.delay(500)}
        >
          <View style={styles.blank} />
          <Text
            center
            type="TextHighlight"
            color="Light"
            numberOfLines={3}
            style={styles.topCarouselTitle}
          >
            {images[index]?.alt_text ?? images[index]?.metadata?.title ?? title}
          </Text>
          <Chip background="Inputbox" style={styles.indicatorChip}>
            <Text type="TertiaryHighlight">
              {1 + index}/{images.length}
            </Text>
          </Chip>
        </Animated.View>
      </SafeAreaView>
    </ThemeView>
  );
};

const CarouselItem = ({ item }: { item: CarouselMedia }) => {
  return (
    <SafeAreaView safeArea style={styles.fullImageContainer}>
      <View style={helpers.stretch}>
        <ZoImage
          url={item.image}
          width="3xl"
          key={item.id}
          contentFit="contain"
          shimmer={ShimmerType.ScreenFit}
        />
      </View>
    </SafeAreaView>
  );
};

const DarkCarousel = WithDarkTheme(FullCarousel);

const FullCarouselSheet = (props: FullCarouselProps) => {
  return (
    <Sheet
      fullScreen
      hideHandle
      isOpen={props.isOpen}
      onDismiss={props.onDismiss}
      disableContentDragForAndroid
    >
      <DarkCarousel {...props} />
    </Sheet>
  );
};

export default FullCarouselSheet;

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
  blank: {
    width: 60,
  },
  indicatorChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderCurve: "continuous",
  },
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
    minHeight: 56,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  topCarouselTitle: {
    fontFamily: "Kalam-Bold",
    flex: 1,
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
