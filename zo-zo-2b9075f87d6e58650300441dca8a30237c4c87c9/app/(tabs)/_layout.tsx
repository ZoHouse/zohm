import { Iconz, Pressable, SafeAreaView } from "@/components/ui";
import device from "@/config/Device";
import helpers from "@/utils/styles/helpers";
import { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import React, { useMemo } from "react";
import Typography from "@/config/typography.json";
import { useThemeColors } from "@/context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";

const end = { x: 0.5, y: 1 };
const locations = [0, 0.3] as const;
const styles = [helpers.stretch, { marginTop: -12 }];

const TabBarBackground = () => {
  const [primary] = useThemeColors(["Background.Primary"]);
  const gradient = useMemo(() => [`${primary}00`, primary] as const, [primary]);

  return (
    <LinearGradient
      colors={gradient}
      end={end}
      locations={locations}
      style={styles}
      pointerEvents="none"
    >
      <SafeAreaView safeArea="bottom" />
    </LinearGradient>
  );
};

const tabScreenOptions: BottomTabNavigationOptions = {
  headerShown: false,
  tabBarBackground: TabBarBackground,
  tabBarStyle: {
    borderTopColor: "transparent",
    borderTopWidth: 0,
    shadowColor: "transparent",
    shadowOpacity: 0,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: device.WINDOW_WIDTH,
  },
};

export default function TabLayout() {
  const [tp, ts] = useThemeColors(["Text.Primary", "Text.Secondary"]);

  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen
        name="explore"
        options={{
          tabBarLabel: "Explore",
          tabBarLabelStyle: Typography.TertiaryHighlight,
          tabBarInactiveTintColor: ts,
          tabBarActiveTintColor: tp,
          tabBarIcon: ({ focused }) => (
            <Iconz
              name="calendar"
              size={24}
              fillTheme={focused ? "Primary" : "ViewOnly"}
            />
          ),
          tabBarIconStyle: {
            marginBottom: 8,
          },
          tabBarHideOnKeyboard: true,
          tabBarButton: (props) => (
            <Pressable
              activeOpacity={0.8}
              children={props.children}
              style={helpers.flexCenter}
              onPress={props.onPress}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          tabBarLabel: "Trips",
          tabBarLabelStyle: Typography.TertiaryHighlight,
          tabBarInactiveTintColor: ts,
          tabBarActiveTintColor: tp,
          tabBarIcon: ({ focused }) => (
            <Iconz
              name="trips"
              size={24}
              fillTheme={focused ? "Primary" : "ViewOnly"}
            />
          ),
          tabBarIconStyle: {
            marginBottom: 8,
          },
          tabBarHideOnKeyboard: true,
          tabBarButton: (props) => (
            <Pressable
              activeOpacity={0.8}
              children={props.children}
              style={helpers.flexCenter}
              onPress={props.onPress}
            />
          ),
        }}
      />
    </Tabs>
  );
}
