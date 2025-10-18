import Pressable from "@/components/ui/Pressable";
import Text from "@/components/ui/Text";
import { useAuth } from "@/context/AuthContext";
import { showToast } from "@/utils/toast";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { crash } from "@react-native-firebase/crashlytics";
import * as Application from "expo-application";
import * as Sentry from "@sentry/react-native";
import crashlytics from "../misc/crashlytics";

const onClear = () => {
  Promise.all([Image.clearDiskCache(), Image.clearMemoryCache()])
    .then((res) => {
      showToast({
        message: "Cache cleared",
        type: "success",
      });
    })
    .catch((er) => {
      showToast({
        message: "Error clearing cache",
        type: "error",
      });
    });
};

const VersionInfo = () => {
  const { logout } = useAuth();
  const onLogout = useCallback(() => {
    logout();
    router.dismissAll();
  }, [logout]);

  const version = useMemo(() => {
    return Application.nativeApplicationVersion &&
      Application.nativeBuildVersion
      ? `${Application.nativeApplicationVersion} (${Application.nativeBuildVersion})`
      : "zo";
  }, []);

  const onRecord = useCallback(() => {
    Sentry.captureException(
      new Error(`[Expo] Test error: ${new Date().toLocaleString()}`)
    );
  }, []);

  const onCrash = useCallback(() => {
    crash(crashlytics);
  }, []);

  return (
    <View style={styles.actionsContainer}>
      <Pressable activeOpacity={0.8} onPress={onLogout}>
        <Text type="Subtitle" style={styles.underline}>
          Logout
        </Text>
      </Pressable>
      <Text type="Subtitle" color="Secondary" style={styles.version}>
        Version: {version}
      </Text>
      {/* {__DEV__ ? (
        <Pressable activeOpacity={0.8} onPress={onClear}>
          <Text type="Subtitle" style={styles.underline}>
            Clear Images Cache
          </Text>
        </Pressable>
      ) : null}
      <View style={styles.divider} />
      <Pressable activeOpacity={0.8} onPress={onRecord}>
        <Text type="Subtitle" color="Secondary" style={styles.underline}>
          Capture Sentry Error
        </Text>
      </Pressable>
      <Pressable activeOpacity={0.8} onPress={onCrash}>
        <Text type="Subtitle" color="Secondary" style={styles.underline}>
          Crash
        </Text>
      </Pressable> */}
    </View>
  );
};

const styles = StyleSheet.create({
  actionsContainer: {
    marginTop: 40,
    gap: 8,
    marginBottom: 24,
  },
  actions: {
    borderRadius: 16,
    borderCurve: "continuous",
    paddingHorizontal: 16,
  },
  underline: {
    textDecorationLine: "underline",
  },
  version: {
    marginVertical: 8,
  },
  divider: {
    height: 16,
  },
});

export default VersionInfo;
