import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export const triggerFeedBack = (
  type: keyof typeof Haptics.ImpactFeedbackStyle = "Light"
) => {
  if (Platform.OS === "android") {
    Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Keyboard_Tap);
  } else {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle[type]);
  }
};

export const triggerNotification = (
  type: keyof typeof Haptics.NotificationFeedbackType
) => {
  if (Platform.OS === "android") {
    switch (type) {
      case "Success":
        Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm);
        break;
      case "Warning":
        Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject);
        break;
      case "Error":
        Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject);
        break;
    }
    return;
  }
  Haptics.notificationAsync(Haptics.NotificationFeedbackType[type]);
};

export const triggerSelection = () => {
  Haptics.selectionAsync();
};
