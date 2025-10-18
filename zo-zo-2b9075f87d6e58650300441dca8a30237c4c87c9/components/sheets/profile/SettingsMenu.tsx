import React, { useEffect, useState, useCallback, memo } from "react";
import * as Notifications from "expo-notifications";
import { Linking } from "react-native";
import { Iconz, Text } from "@/components/ui";
import { ActionsSheet } from "@/components/sheets";
import { useCurrency } from "@/context/CurrencyContext";
import { useTheme } from "@/context/ThemeContext";
import useVisibilityState from "@/hooks/useVisibilityState";
import Animated, { FadeInRight, FadeOutRight } from "react-native-reanimated";

interface SettingsMenuProps {
  isOpen: boolean;
  onDismiss: () => void;
  openCurrencySheet: () => void;
}

const themeEmojiMap = {
  system: "✨",
  light: "🌞",
  dark: "🌙",
};

const SettingsMenu = ({
  isOpen,
  onDismiss,
  openCurrencySheet,
}: SettingsMenuProps) => {
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const { selectedCurrency } = useCurrency();

  useEffect(() => {
    checkNotificationPermissions();
  }, []);

  const checkNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setIsNotificationsEnabled(status === "granted");
    } catch (error) {
      console.error("Error checking notification permissions:", error);
      setIsNotificationsEnabled(false);
    }
  };

  const handleNotificationsPress = useCallback(() => {
    if (!isNotificationsEnabled) {
      Notifications.requestPermissionsAsync().then(({ status, granted }) => {
        const isGranted = status === "granted" || granted;
        setIsNotificationsEnabled(isGranted);
        if (!isGranted) {
          Linking.openURL("app-settings:");
        }
      });
    }
  }, [isNotificationsEnabled]);

  const { userTheme, selectUserTheme } = useTheme();
  const [isThemeSheetOpen, showThemeSheet, hideThemeSheet] =
    useVisibilityState(false);

  const items = [
    {
      id: "notifications",
      title: "Notifications",
      onPress: handleNotificationsPress,
      emoji: isNotificationsEnabled ? "🔔" : "🔕",
      content: (
        <Text type="TextHighlight">
          {isNotificationsEnabled ? "On" : "Off"}
        </Text>
      ),
    },
    {
      id: "currency",
      title: "Currency",
      onPress: openCurrencySheet,
      emoji: "💰",
      content: <Text type="TextHighlight">{selectedCurrency.id}</Text>,
    },
    {
      id: "theme",
      title: "Theme",
      onPress: showThemeSheet,
      emoji: themeEmojiMap[userTheme],
      content: (
        <Text type="TextHighlight" style={{ textTransform: "capitalize" }}>
          {userTheme}
        </Text>
      ),
    },
  ];

  return (
    <>
      {isOpen ? (
        <ActionsSheet
          isOpen={isOpen}
          onDismiss={onDismiss}
          items={items}
          title="Settings"
          noDismiss
        />
      ) : null}
      {isThemeSheetOpen ? (
        <ThemeSheet
          isOpen={isThemeSheetOpen}
          onDismiss={hideThemeSheet}
          onSelect={selectUserTheme}
          selectedTheme={userTheme}
        />
      ) : null}
    </>
  );
};

export default SettingsMenu;

interface ThemeSheetProps {
  isOpen: boolean;
  onDismiss: () => void;
  onSelect: (theme: "system" | "light" | "dark") => void;
  selectedTheme: "system" | "light" | "dark";
}

const SelectedIcon = memo(() => (
  <Animated.View entering={FadeInRight} exiting={FadeOutRight}>
    <Iconz name="check-circle" size={20} fillTheme="Primary" />
  </Animated.View>
));

const ThemeSheet = ({
  isOpen,
  onDismiss,
  onSelect,
  selectedTheme,
}: ThemeSheetProps) => {
  const items = [
    {
      id: "system",
      title: "System",
      onPress: () => onSelect("system"),
      emoji: themeEmojiMap.system,
      content: selectedTheme === "system" ? <SelectedIcon /> : null,
    },
    {
      id: "light",
      title: "Light",
      onPress: () => onSelect("light"),
      emoji: themeEmojiMap.light,
      content: selectedTheme === "light" ? <SelectedIcon /> : null,
    },
    {
      id: "dark",
      title: "Dark",
      onPress: () => onSelect("dark"),
      emoji: themeEmojiMap.dark,
      content: selectedTheme === "dark" ? <SelectedIcon /> : null,
    },
  ];

  return (
    <ActionsSheet
      isOpen={isOpen}
      onDismiss={onDismiss}
      items={items}
      title="Select Theme"
      noDismiss
    />
  );
};
