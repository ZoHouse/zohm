import React, { memo, useMemo } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { svgFormatToPng, toInitials } from "@/utils/data-types/string";
import Colors from "@/config/colors.json";
import Text from "./Text";
import { useTheme } from "@/context/ThemeContext";
import helpers from "@/utils/styles/helpers";

const getRandomColor = (theme: "light" | "dark") => {
  const colors = [
    Colors[theme].Status.Failed,
    Colors[theme].Status.Success,
    Colors[theme].Status.Progress,
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

interface AvatarProps {
  size: number;
  uri?: string;
  alt: string;
  style?: StyleProp<ViewStyle>;
}

const Avatar = ({ size, uri, style, alt }: AvatarProps) => {
  const imageUri = useMemo(
    () => (uri ? svgFormatToPng(uri) : undefined),
    [uri]
  );

  const viewStyle = useMemo(
    () => [styles.container, { width: size, height: size }, style],
    [style, size]
  );

  return (
    <View style={viewStyle}>
      {!imageUri ? (
        <Initials alt={alt} size={size} />
      ) : (
        <Image
          source={uri}
          style={helpers.absoluteFit}
          contentFit="cover"
          cachePolicy="disk"
          alt="Profile Avatar"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 200,
    borderCurve: "continuous",
    overflow: "hidden",
  },
});

export default Avatar;

interface InitialsProps {
  alt: string;
  size: number;
}

const Initials = memo(({ alt, size }: InitialsProps) => {
  const { colorScheme } = useTheme();

  const initials = useMemo(() => toInitials(alt), [alt]);

  const initialBgStyle = useMemo(
    () => [
      { backgroundColor: getRandomColor(colorScheme) },
      helpers.absoluteCenter,
    ],
    [colorScheme]
  );

  const initialStyle = useMemo(
    () => [{ fontSize: Math.max(size / 2, 20), lineHeight: undefined }],
    [size]
  );

  return (
    <View style={initialBgStyle}>
      <Text type="SectionTitle" style={initialStyle}>
        {initials}
      </Text>
    </View>
  );
});
