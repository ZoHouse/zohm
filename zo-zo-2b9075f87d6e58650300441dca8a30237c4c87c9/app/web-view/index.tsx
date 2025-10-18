import { StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo } from "react";
import { WebView, WebViewNavigation } from "react-native-webview";
import helpers from "@/utils/styles/helpers";
import Ziew from "@/components/ui/View";
import Iconz from "@/components/ui/Iconz";
import SafeAreaView from "@/components/ui/SafeAreaView";
import { openURL } from "expo-linking";

const WebViewScreen = () => {
  const { url } = useLocalSearchParams<{ url: string }>();
  const source = useMemo(
    () => (url ? { uri: `${url}?utm_source=zostel-app` } : null),
    [url]
  );

  const onRedirect = useCallback(
    () => (source?.uri ? openURL(source.uri) : {}),
    [source?.uri]
  );

  return (
    <Ziew background style={helpers.stretch}>
      <SafeAreaView safeArea="top" style={styles.head}>
        <Iconz
          name="cross"
          size={24}
          fillTheme="Primary"
          onPress={router.back}
        />
        <View>
          <Iconz
            name="external"
            size={24}
            fillTheme="Primary"
            onPress={onRedirect}
          />
        </View>
      </SafeAreaView>
      {source ? <WebView source={source} style={helpers.stretch} /> : null}
    </Ziew>
  );
};

export default WebViewScreen;

const styles = StyleSheet.create({
  head: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
