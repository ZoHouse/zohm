import React, { JSX, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface AnimatedAccordionItemProps {
  show: boolean;
  children: JSX.Element;
  duration?: number;
}

export const AccordionItem = ({
  show,
  children,
  duration = 200,
}: AnimatedAccordionItemProps) => {
  const isExpanded = useSharedValue(show);
  const height = useSharedValue(0);

  useEffect(() => {
    isExpanded.value = show;
  }, [show]);

  const derivedHeight = useDerivedValue(() =>
    withTiming(height.value * Number(isExpanded.value), {
      duration,
    })
  );

  const bodyStyle = useAnimatedStyle(() => ({
    height: derivedHeight.value,
    overflow: "hidden",
  }));

  return (
    <Animated.View style={bodyStyle}>
      <View
        style={styles.wrapper}
        onLayout={(e) => {
          height.value = e.nativeEvent.layout.height;
        }}
      >
        {show ? children : <></>}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    position: "absolute",
    display: "flex",
    alignItems: "center",
  },
});

export default AccordionItem;
