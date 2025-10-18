import View from "@/components/ui/View";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Image } from "expo-image";
import * as Application from "expo-application";
import { Platform, StyleSheet } from "react-native";
import {
  Href,
  router,
  SplashScreen,
  useNavigation,
  useNavigationContainerRef,
} from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { useReactiveRef } from "@/utils/hooks";
import { prefetchAssets } from "@/utils/constants";
import navData from "@/utils/global";
import { webLinkToHref } from "@/utils/deep-linking";
import useProfile from "@/hooks/useProfile";
import useQuery from "@/hooks/useQuery";
import UpdateSheet from "@/components/sheets/UpdateSheet";
import { logAxiosError } from "@/utils/network";
import RotatingView from "@/components/ui/RotatingItem";
import Logger from "@/utils/logger";
import {
  checkForUpdateAsync,
  fetchUpdateAsync,
  reloadAsync,
} from "expo-updates";
import { authQueryEndpoints } from "@/utils/auth/endpoints/auth";
import { axiosInstances } from "@/utils/auth/client";
import { ApplicationSeed } from "@/definitions/auth";
import storage from "@/utils/storage";
import { showToast } from "@/utils/toast";
import { setSeed } from "@/utils/store/seed";

const EAS_CHECK = "app-eas-check";
const APP_BUILD = "app-build";

export default function HomeScreen() {
  useEffect(() => {
    Logger.appOpen();
    SplashScreen.hideAsync();
  }, []);

  const [isEasChecked, setIsEasChecked] = useState(false);

  useEffect(() => {
    axiosInstances[authQueryEndpoints.AUTH_APPLICATION_SEED.server]
      .get(authQueryEndpoints.AUTH_APPLICATION_SEED.url)
      .then((res) => res.data as ApplicationSeed)
      .then((seed) => {
        setSeed(seed);
        if (seed.disabled_features && seed.disabled_features.length) {
          return seed.disabled_features.includes(EAS_CHECK);
        }
        return true;
      })
      .then((isDisabled) => {
        if (isDisabled || __DEV__) {
          throw new Error("EAS CHECK DISABLED");
        }
        return Promise.all([
          checkForUpdateAsync(),
          storage.getString(APP_BUILD).catch(() => null),
        ]);
      })
      .then(([update, latestCheckedUpdate]) => {
        if (
          update.isAvailable &&
          update.manifest.id &&
          latestCheckedUpdate !== update.manifest.id
        ) {
          showToast({ message: "Downloading update..." });
          return fetchUpdateAsync().then((value) =>
            storage.setString(APP_BUILD, value.manifest?.id ?? "")
          );
        }
        throw new Error("NO UPDATE AVAILABLE");
      })
      .then(() => reloadAsync())
      .catch((er) => {
        console.log("UPDATE CHECK ERROR", er);
        setIsEasChecked(true);
      });
  }, []);

  return (
    <View background="Zostel" style={styles.screen}>
      <RotatingView>
        <Image
          source={require("@/assets/images/icon.png")}
          style={styles.icon}
        />
      </RotatingView>
      {isEasChecked && <StartUp />}
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 72,
    height: 72,
  },
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
    padding: 24,
  },
});

const StartUp = memo(() => {
  const {
    authState: { isAuthenticated },
  } = useAuth();

  const isFocused = useIsFocused();
  const isFocusedRef = useReactiveRef(isFocused);
  const { refetchProfile } = useProfile();
  const { data: appVersion } = useQuery(
    "DISCOVER_APP_VERSION",
    {
      select: (data) => data.data,
      throwOnError: (er) => {
        logAxiosError(er);
        return false;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
    {
      search: {
        platform: Platform.OS,
        version: Application.nativeApplicationVersion ?? "zo",
        build: Application.nativeBuildVersion ?? "zo",
      },
    }
  );
  const [isUpdateSheetVisible, setUpdateSheetVisible] = useState<
    boolean | null
  >(null);

  const closeAppUpdateSheet = useCallback(() => {
    setUpdateSheetVisible(false);
  }, []);

  useEffect(() => {
    if (appVersion) {
      setUpdateSheetVisible(appVersion.force_update || appVersion.soft_update);
    }
  }, [appVersion]);

  const safeNavigate = useSafeNavigate();

  const checkAuthAndNavigate = useCallback(() => {
    if (isUpdateSheetVisible !== false) {
      return;
    }
    if (isAuthenticated !== null) {
      if (!isAuthenticated) {
        safeNavigate("/onboarding");
      } else {
        refetchProfile()
          .then((res) => res.data)
          .then((prof) => {
            if (prof?.first_name && prof.avatar.image) {
              safeNavigate("/(tabs)/explore");
            } else {
              safeNavigate("/onboarding");
            }
          });
      }
    }
  }, [isAuthenticated, isUpdateSheetVisible]);

  if (!isAuthenticated) {
    navData.canNavigateToDeepLink = false;
  }

  useEffect(() => {
    if (isFocusedRef.current) {
      checkAuthAndNavigate();
    }
  }, [checkAuthAndNavigate]);

  useEffect(() => {
    prefetchAssets()
      .then((res) => {
        console.log("ASSETS PRELOADED");
      })
      .catch((er) => {
        console.log("ASSETS PRELOAD FAILED");
      });
  }, []);

  return (
    <>
      <NavigationHandler />
      {isUpdateSheetVisible && appVersion && (
        <UpdateSheet
          isOpen={isUpdateSheetVisible}
          onDismiss={closeAppUpdateSheet}
          updateData={appVersion}
        />
      )}
    </>
  );
});

const NavigationHandler = () => {
  const navigation = useNavigation();

  const onHomePage = useCallback(() => {
    if (!navData.canNavigateToDeepLink) {
      navData.canNavigateToDeepLink = true;
      const linkValue = navData.value;
      navData.value = "";
      if (linkValue && linkValue !== "zostel:///") {
        if (linkValue.startsWith("http")) {
          webLinkToHref(linkValue).then(({ type, path }) => {
            if (type === "webview") {
              router.navigate(`/web-view?url=${path}`);
              // Linking.openURL(path);
            } else {
              router.navigate(path as Href);
            }
          });
        } else if (linkValue.startsWith("zostel://")) {
          router.navigate(linkValue as Href);
        }
      } else if (navData.notificationData) {
        const { name, code } = navData.notificationData;
        const path = `/${name}/${code}`;
        router.navigate(path as Href);
        navData.notificationData = null;
      }
    }
  }, []);

  const onScreenChange = useCallback((route: any) => {
    if (!route) return;
    const lastRouteName = String(route?.name);
    setTimeout(() => {
      Logger.logScreen(lastRouteName, route);
    });
    if (lastRouteName === "(tabs)") {
      onHomePage();
    }
  }, []);

  useEffect(() => {
    const listener = (ev: any) => {
      const routes = ev.data.state.routes;
      const lastRoute = routes[routes.length - 1];
      onScreenChange(lastRoute);
    };

    navigation.addListener("state", listener);
    return () => {
      return navigation.removeListener("state", listener);
    };
  }, []);

  return null;
};

const useSafeNavigate = () => {
  const navigationRef = useNavigationContainerRef();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);
  const safeNavigate = useCallback((link: Href) => {
    clearTimer();
    if (navigationRef.isReady()) {
      router.push(link);
    } else {
      timerRef.current = setTimeout(() => safeNavigate(link), 500);
    }
  }, []);

  useEffect(() => {
    return () => clearTimer();
  }, []);
  return safeNavigate;
};
