import {
  GestureResponderEvent,
  Platform,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";
import React, { useCallback } from "react";
import {
  AndroidHaptics,
  impactAsync,
  ImpactFeedbackStyle,
  performAndroidHapticsAsync,
} from "expo-haptics";

interface PressableProps extends TouchableOpacityProps {
  impact?: ImpactFeedbackStyle;
}

const Pressable = ({ onPress: _onPress, impact, ...props }: PressableProps) => {
  const onPress = useCallback(
    (e: GestureResponderEvent) => {
      if (_onPress) {
        if (Platform.OS === "android") {
          performAndroidHapticsAsync(AndroidHaptics.Keyboard_Tap);
        } else {
          impactAsync(impact ?? ImpactFeedbackStyle.Light);
        }
        _onPress(e);
      }
    },
    [_onPress, impact]
  );

  return <TouchableOpacity onPress={onPress} {...props} />;
};

export default Pressable;
