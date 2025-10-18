import React from "react";
import { AuthProvider } from "@/context/AuthContext";
import { GlobalThemeProvider } from "@/context/ThemeContext";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Portal, PortalProvider } from "@gorhom/portal";
import helpers from "@/utils/styles/helpers";
import QueryClientProvider from "@/context/QueryClientProvider";
import LocationProvider from "@/context/LocationContext";
import CurrencyProvider from "@/context/CurrencyContext";
import BookingProvider from "@/context/BookingContext";
import Toast from "react-native-toast-message";
import { toastConfig } from "@/utils/toast";
import InitialHooks from "@/components/helpers/misc/InitialHooks";
import NoInternet from "@/components/ui/NoInternet";
import * as Sentry from "@sentry/react-native";
import { ReducedMotionConfig, ReduceMotion } from "react-native-reanimated";
import { setCrashlyticsCollectionEnabled } from "@react-native-firebase/crashlytics";
import crashlytics from "@/components/helpers/misc/crashlytics";
// import * as Clarity from "@microsoft/react-native-clarity";

if (!__DEV__) {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,

    // Adds more context data to events (IP address, cookies, user, etc.)
    // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
    sendDefaultPii: true,

    // Configure Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    replaysSessionQuality: "low",
    integrations: [
      Sentry.mobileReplayIntegration({
        maskAllImages: false,
        maskAllText: false,
        maskAllVectors: false,
      }),
    ],
    normalizeDepth: 6,
    maxValueLength: 500,

    // uncomment the line below to enable Spotlight (https://spotlightjs.com)
    // spotlight: __DEV__,
  });
  // if (process.env.EXPO_PUBLIC_CLARITY_ID) {
  //   Clarity.initialize(process.env.EXPO_PUBLIC_CLARITY_ID, {
  //     logLevel: Clarity.LogLevel.None,
  //   });
  // }
}

if (__DEV__) {
  setCrashlyticsCollectionEnabled(crashlytics, false);
}

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
  fade: true,
  duration: 200,
});

export default Sentry.wrap(function RootLayout() {
  return (
    <GestureHandlerRootView style={helpers.flex}>
      <GlobalThemeProvider>
        <QueryClientProvider>
          <AuthProvider>
            <CurrencyProvider>
              <BookingProvider>
                <LocationProvider>
                  <BottomSheetModalProvider>
                    <PortalProvider>
                      <RootLayoutNav />
                    </PortalProvider>
                    <NoInternet />
                  </BottomSheetModalProvider>
                  <InitialHooks />
                </LocationProvider>
              </BookingProvider>
            </CurrencyProvider>
          </AuthProvider>
        </QueryClientProvider>
        <PortalProvider>
          <Portal>
            <Toast config={toastConfig} />
          </Portal>
        </PortalProvider>
        <ReducedMotionConfig mode={ReduceMotion.Never} />
      </GlobalThemeProvider>
    </GestureHandlerRootView>
  );
});

function RootLayoutNav() {
  return (
    <Stack initialRouteName="index" screenOptions={screenOptions}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" options={disableGesture} />
      <Stack.Screen name="onboarding" options={disableGesture} />
      <Stack.Screen name="booking/[id]" options={disableGesture} />
      {/* <Stack.Screen name="trip/booking/[id]" options={disableGesture} /> */}
    </Stack>
  );
}

const screenOptions = {
  headerShown: false,
};

const disableGesture = {
  gestureEnabled: false,
};
