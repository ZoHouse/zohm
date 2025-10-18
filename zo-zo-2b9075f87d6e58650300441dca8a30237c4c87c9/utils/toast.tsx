import { StyleSheet, View } from "react-native";
import Toast, { BaseToastProps } from "react-native-toast-message";
import Text from "@/components/ui/Text";
import Iconz from "@/components/ui/Iconz";
import Ziew from "@/components/ui/View";
import ThemeView from "@/components/ui/ThemeView";

const showToast = (config: {
  message: string;
  type?: "success" | "error" | "theme";
  visibilityTime?: number;
  onHide?: () => void;
}) => {
  Toast.show({
    text1: config.message,
    type: config.type ?? "theme",
    position: "bottom",
    visibilityTime: config.visibilityTime ?? 2000,
    onHide: config.onHide ?? (() => {}),
  });
};

const toastConfig = {
  success: (props: BaseToastProps) => (
    <View style={styles.toastContainer}>
      <ThemeView style={styles.successToast} theme="Vibes.Green">
        <Iconz name="check-circle" fillTheme="Primary" size={24} />
        <Text type="Subtitle" style={styles.text}>
          {props.text1}
        </Text>
      </ThemeView>
    </View>
  ),
  error: (props: BaseToastProps) => (
    <View style={styles.toastContainer}>
      <ThemeView style={styles.errorToast} theme="Vibes.Red">
        <Iconz name="cross-circle" fillTheme="Primary" size={24} />
        <Text type="Subtitle" style={styles.text}>
          {props.text1}
        </Text>
      </ThemeView>
    </View>
  ),
  theme: (props: BaseToastProps) => (
    <View style={styles.toastContainer}>
      <ThemeView style={styles.themeToast} theme="Text.Primary">
        <Iconz name="zo" theme="Text.Button" size={24} />
        <Text color="Button" type="Subtitle" style={styles.text}>
          {props.text1}
        </Text>
      </ThemeView>
    </View>
  ),
};

export { showToast, toastConfig };

const styles = StyleSheet.create({
  text: {
    flex: 1,
  },
  errorToast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderCurve: "continuous",
    padding: 16,
  },
  toastContainer: {
    width: "100%",
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  successToast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderCurve: "continuous",
    padding: 16,
  },
  themeToast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderCurve: "continuous",
    padding: 16,
  },
  whiteText: {
    color: "white",
  },
});
