import AnimatedShimmer from "@/components/ui/AnimatedShimmer";
import device from "@/config/Device";
import helpers from "@/utils/styles/helpers";
import { Image, ImageContentFit, ImageErrorEventData } from "expo-image";
import React, { memo, useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

const widthMap = {
  xs: 180,
  s: 360,
  sm: 480,
  m: 540,
  l: 720,
  xl: 900,
  // s: Math.max(device.WINDOW_WIDTH, 360),
  // m: Math.max(device.WINDOW_WIDTH, 540),
  // l: Math.max(device.WINDOW_HEIGHT, 720),
  // xl: Math.max(device.WINDOW_HEIGHT, 900),
  "2xl": Math.max(device.WINDOW_HEIGHT, 1080),
  "3xl": Math.max(device.WINDOW_HEIGHT, 1260),
  "4xl": Math.max(device.WINDOW_HEIGHT, 1440),
};

export enum ShimmerType {
  Default = 1,
  ScreenFit = 2,
  None = 3,
}
export interface ZoImageProps {
  url: string;
  id?: string | null;
  /**
   * - `xs: 180`
   * - `s: 360`
   * - `sm: 480`
   * - `m: 540`
   * - `l: 720`
   * - `xl: 900`
   * - `2xl: max<1080 | window height>`
   * - `3xl: max<1260 | window height>`
   * - `4xl: max<1440 | window height>`
   * - `number`
   */
  width: number | keyof typeof widthMap | null;
  contentFit?: ImageContentFit;
  shimmer?: ShimmerType;
  alt?: string
}

const makeSource = (uri: string, width: ZoImageProps["width"]) => {
  if (width) {
    if (typeof width === "number") {
      return { uri: `${uri}?w=${Math.round(width)}` };
    } else {
      return { uri: `${uri}?w=${Math.round(widthMap[width])}` };
    }
  }
  return { uri };
};

enum UIState {
  LOADING = 1,
  ERROR = 2,
  LOADED = 3,
}

const loadedRefMap: Record<string, boolean> = {};

const ZoImage: React.FC<ZoImageProps> = ({
  url,
  id,
  width,
  contentFit = "cover",
  shimmer = ShimmerType.Default,
  alt
}: ZoImageProps) => {
  const source = useMemo(() => makeSource(url, width), [url, width]);
  const [uiState, setUiState] = useState<UIState>(UIState.LOADING);

  const onLoadStart = useCallback(() => {
    if (loadedRefMap[source.uri]) {
      return;
    }
    setUiState(UIState.LOADING);
  }, [source.uri]);

  const onLoad = useCallback(() => {
    loadedRefMap[source.uri] = true;
    setUiState(UIState.LOADED);
  }, [source.uri]);

  const onError = useCallback((e: ImageErrorEventData) => {
    setUiState(UIState.ERROR);
  }, []);

  return (
    <>
      <Image
        source={source}
        contentFit={contentFit}
        recyclingKey={id}
        style={helpers.fit}
        onLoad={onLoad}
        onLoadStart={onLoadStart}
        onError={onError}
        cachePolicy="disk"
        alt={alt}
        transition={100}
      />
      {uiState === UIState.LOADING ? (
        shimmer === ShimmerType.Default ? (
          <DefaultShimmer key={`${id}-loading`} />
        ) : shimmer === ShimmerType.ScreenFit ? (
          <ScreenFitShimmer key={`${id}-loading`} />
        ) : null
      ) : uiState === UIState.ERROR ? (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          key={`${id}-error`}
          style={helpers.absoluteFit}
        >
          <Image
            source={require("@/assets/images/placeholder.jpg")}
            style={helpers.absoluteFit}
            contentFit="cover"
          />
        </Animated.View>
      ) : null}
    </>
  );
};

export default memo(ZoImage);

const DefaultShimmer = memo(() => (
  <Animated.View
    entering={FadeIn}
    exiting={FadeOut}
    style={helpers.absoluteFit}
  >
    <AnimatedShimmer />
  </Animated.View>
));

const ScreenFitShimmer = memo(() => (
  <Animated.View
    entering={FadeIn}
    exiting={FadeOut}
    style={helpers.absoluteFitCenter}
  >
    <View style={helpers.deviceFit}>
      <AnimatedShimmer />
    </View>
  </Animated.View>
));
