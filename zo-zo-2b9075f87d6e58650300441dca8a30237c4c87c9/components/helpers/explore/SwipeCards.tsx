import React, {
  useCallback,
  useState,
  useEffect,
  useMemo,
  useRef,
  memo,
} from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Track } from "@/definitions/explore";
import helpers from "@/utils/styles/helpers";
import device from "@/config/Device";
import SwipeItem from "@/components/helpers/explore/SwipeItem";
import { triggerFeedBack } from "@/utils/haptics";

interface SwipeCardsProps {
  data: Track[];
  style?: StyleProp<ViewStyle>;
}

const _rotationDeg = 45;
const SIZE = {
  width: 280,
  height: 320,
};

const Card = ({
  track,
  index,
  onShuffle,
  topTx,
  isTop,
  keysRef,
}: {
  track: Track;
  index: number;
  onShuffle: () => void;
  topTx: SharedValue<number>;
  isTop: boolean;
  keysRef: React.RefObject<number[]>;
}) => {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const i = useSharedValue(index);
  const z = useSharedValue(Math.max(0, (keysRef.current.length - index) * 100));
  const shallGoBack = useSharedValue(false);

  useEffect(() => {
    i.value = withTiming(index, { duration: 1000 });
    z.value = Math.max(0, (keysRef.current.length - index) * 100);
    shallGoBack.value = false;
  }, [index]);

  const pan = Gesture.Pan()
    .onChange((e) => {
      if (!isTop) return;
      let __tx = e.translationX;
      if (e.velocityX <= -800 || e.velocityX >= 800) {
        __tx = __tx + e.velocityX / 100;
      }
      tx.value = __tx;
      ty.value = e.translationY;
      topTx.value = __tx;
      shallGoBack.value = Math.abs(__tx) > 162;
    })
    .onEnd((e) => {
      if (!isTop) return;
      topTx.value = withSpring(0, { dampingRatio: 0.64 });
      if (shallGoBack.value) {
        z.value = 0;
        runOnJS(onShuffle)();
      }
      tx.value = withSpring(0, { dampingRatio: 0.64 });
      ty.value = withSpring(0, { dampingRatio: 0.64 });
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = `${interpolate(
      i.value,
      keysRef.current,
      [0, 2, -4, 4]
      // [0, 2, -4, -6, -8, 8, 6, 4, 2, 0]
    )}deg`;
    const backgroundTx = interpolate(
      topTx.value,
      [-device.WINDOW_WIDTH / 2, 0, device.WINDOW_WIDTH / 2],
      [device.WINDOW_WIDTH / 8, 0, -device.WINDOW_WIDTH / 8],
      "clamp"
    );
    return {
      transform: [
        { translateX: isTop ? tx.value : backgroundTx },
        // { translateX: tx.value },
        { translateY: ty.value },
        { rotate },
      ],
    };
  });

  const rotateYStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(
      tx.value,
      [-device.WINDOW_WIDTH / 2, 0, device.WINDOW_WIDTH / 2],
      [_rotationDeg, 0, -_rotationDeg],
      "clamp"
    );
    const scale = interpolate(
      tx.value,
      [-device.WINDOW_WIDTH / 2, 0, device.WINDOW_WIDTH / 2],
      [0.85, 1, 0.85],
      "clamp"
    );
    const backgroundRotateY = interpolate(
      topTx.value,
      [-device.WINDOW_WIDTH / 2, 0, device.WINDOW_WIDTH / 2],
      [-_rotationDeg / 3, 0, _rotationDeg / 3],
      "clamp"
    );
    return {
      transform: [
        {
          perspective: 600,
        },
        { rotateY: isTop ? `${rotateY}deg` : `${backgroundRotateY}deg` },
        // { rotateY: `${rotateY}deg` },
        { scale },
      ],
    };
  });

  const zStyle = useAnimatedStyle(() => {
    return {
      zIndex: z.value,
    };
  });

  const renderItem = useMemo(() => {
    return <SwipeItem track={track} />;
  }, [track.id]);

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.cardBox, animatedStyle, zStyle]}>
        <Animated.View style={[styles.cardContainer, rotateYStyle]}>
          {renderItem}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};

const SwipeCards = ({ data, style }: SwipeCardsProps) => {
  const [list, setList] = useState([...data.slice(0, 4)]);
  const topTx = useSharedValue(0);

  const nextIndex = useRef(list.length);
  const max = useRef(data.length);

  const setLastTrack = useCallback(() => {
    const nextTrack = data[nextIndex.current];
    nextIndex.current++;
    if (nextIndex.current === max.current) {
      nextIndex.current = 0;
    }
    setTimeout(() => {
      setList((prev) => {
        prev[prev.length - 1] = nextTrack;
        return [...prev];
      });
    }, 200);
  }, []);

  const onShuffle = useCallback((index: number) => {
    setList((prev) => {
      const newList = [...prev];
      const removed = newList.splice(index, 1);
      return [...newList, ...removed];
    });
    triggerFeedBack();
    setLastTrack();
  }, []);

  const [topElement, setTopElement] = useState(list[0]);

  useEffect(() => {
    setTimeout(() => {
      setTopElement(list[0]);
    }, 200);
  }, [list]);

  const keysRef = useRef<number[]>([...data.keys()]);

  return (
    <Animated.View style={style}>
      <GestureHandlerRootView style={helpers.flex}>
        <View style={styles.container}>
          {list.map((track, index) => (
            <Card
              onShuffle={() => onShuffle(index)}
              key={track.id}
              track={track}
              index={index}
              topTx={topTx}
              isTop={topElement.id === track.id}
              keysRef={keysRef}
            />
          ))}
        </View>
      </GestureHandlerRootView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    height: 360,
    width: "100%",
  },
  cardContainer: {
    width: SIZE.width,
    height: SIZE.height,
    position: "absolute",
  },
  cardBox: {
    width: SIZE.width,
    height: SIZE.height,
    borderCurve: "continuous",
    borderRadius: 16,
    position: "absolute",
  },
});

export default memo(SwipeCards);
