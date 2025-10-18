import { IconColorType, Theme, useThemeColors } from "@/context/ThemeContext";
import { Image, ImageStyle } from "expo-image";
import { useMemo } from "react";
import { StyleProp, View } from "react-native";
import Pressable from "./Pressable";

interface IconProps {
  name: Icons;
  size?: number;
  fill?: string;
  style?: StyleProp<ImageStyle>;
  onPress?: () => void;
  fillTheme?: IconColorType;
  theme?: Theme;
  noFill?: boolean;
}

// https://reactnative.dev/docs/images#static-image-resources

const iconPaths = {
  search: require("@/assets/vectors/icons/search.svg"),
  downAngle: require("@/assets/vectors/icons/downAngle.svg"),
  "arrow-left": require("@/assets/vectors/icons/arrow-left.svg"),
  cross: require("@/assets/vectors/icons/cross.svg"),
  "arrow-right": require("@/assets/vectors/icons/arrow-right.svg"),
  settings: require("@/assets/vectors/icons/settings.svg"),
  more: require("@/assets/vectors/icons/more.svg"),
  "founder-badge": require("@/assets/vectors/icons/founder-badge.svg"),
  rightAngle: require("@/assets/vectors/icons/rightAngle.svg"),
  external: require("@/assets/vectors/icons/external.svg"),
  info: require("@/assets/vectors/icons/info.svg"),
  aadhar: require("@/assets/vectors/icons/aadhar.svg"),
  passport: require("@/assets/vectors/icons/passport.svg"),
  zostel: require("@/assets/vectors/icons/zostel.svg"),
  instagram: require("@/assets/vectors/icons/instagram.svg"),
  youtube: require("@/assets/vectors/icons/youtube.svg"),
  x: require("@/assets/vectors/icons/x.svg"),
  zograffiti: require("@/assets/vectors/icons/zograffiti.svg"),
  "check-circle": require("@/assets/vectors/icons/check-circle.svg"),
  "cross-circle": require("@/assets/vectors/icons/cross-circle.svg"),
  edit: require("@/assets/vectors/icons/edit.svg"),
  plus: require("@/assets/vectors/icons/plus.svg"),
  minus: require("@/assets/vectors/icons/minus.svg"),
  copy: require("@/assets/vectors/icons/copy.svg"),
  whatsapp: require("@/assets/vectors/icons/whatsapp.svg"),
  zo: require("@/assets/vectors/icons/zo.svg"),
  share: require("@/assets/vectors/icons/share.svg"),
  "locate-me": require("@/assets/vectors/icons/locate-me.svg"),
  chat: require("@/assets/vectors/icons/chat.svg"),
  calendar: require("@/assets/vectors/icons/calendar.svg"),
  clock: require("@/assets/vectors/icons/clock.svg"),
  "contact-book": require("@/assets/vectors/icons/contact-book.svg"),
  filter: require("@/assets/vectors/icons/filter.svg"),
  resetMap: require("@/assets/vectors/icons/resetMap.svg"),
  upAngle: require("@/assets/vectors/icons/upAngle.svg"),
  alert: require("@/assets/vectors/icons/alert.svg"),
  star: require("@/assets/vectors/icons/star.svg"),
  camera: require("@/assets/vectors/icons/camera.svg"),
  leftAngle: require("@/assets/vectors/icons/leftAngle.svg"),
  mute: require("@/assets/vectors/icons/mute.svg"),
  unmute: require("@/assets/vectors/icons/unmute.svg"),
  trips: require("@/assets/vectors/icons/trips.svg"),
  not: require("@/assets/vectors/icons/not.svg"),
} as const;

export type Icons = keyof typeof iconPaths;

const getIconPath = (name: Icons) => iconPaths[name];

export default function Iconz({
  name,
  size = 24,
  fill,
  style,
  onPress,
  fillTheme = "Primary",
  noFill = false,
  theme,
}: IconProps) {
  const [iconColor] = useThemeColors(theme ? [theme] : [`Icon.${fillTheme}`]);

  const iconStyle = useMemo(
    () => [
      {
        width: size,
        height: size,
      },
      style,
    ],
    [size, style]
  );

  return onPress ? (
    <Pressable activeOpacity={0.8} onPress={onPress}>
      <Image
        source={getIconPath(name)}
        style={iconStyle}
        tintColor={noFill ? undefined : fill ?? iconColor}
      />
    </Pressable>
  ) : (
    <View>
      <Image
        source={getIconPath(name)}
        style={iconStyle}
        tintColor={noFill ? undefined : fill ?? iconColor}
      />
    </View>
  );
}
