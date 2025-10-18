import React, { useMemo } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Pressable from "./Pressable";
import Text from "./Text";
import Iconz, { Icons } from "./Iconz";
import { isValidString } from "@/utils/data-types/string";
import { IconColorType } from "@/context/ThemeContext";

interface SectionTitleProps {
  children: string;
  subtitle?: string;
  type?: "Title" | "SectionTitle";
  noHorizontalPadding?: boolean;
  noVerticalPadding?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: Icons;
  iconSize?: number;
  onIconPress?: () => void;
  content?: React.ReactNode;
  iconFill?: IconColorType;
  onPress?: () => void;
}

const SectionTitle: React.FC<SectionTitleProps> = ({
  children,
  noHorizontalPadding,
  noVerticalPadding,
  subtitle,
  style,
  onPress,
  icon,
  type = "SectionTitle",
  iconSize = 16,
  onIconPress,
  content,
  iconFill = "ViewOnly",
}) => {
  const pressableStyle = useMemo(
    () => [
      noHorizontalPadding ? styles.containerWithoutPadding : styles.container,
      noVerticalPadding ? styles.containerWithoutVerticalPadding : {},
      style,
    ],
    [noHorizontalPadding, noVerticalPadding, style]
  );

  return (
    <Pressable
      activeOpacity={0.8}
      onPress={onPress}
      disabled={!onPress}
      style={pressableStyle}
    >
      <View style={styles.upper}>
        <Text style={styles.flex} type={type}>
          {children}
        </Text>
        {!content ? (
          icon ? (
            <Pressable style={styles.icon} onPress={onIconPress ?? onPress}>
              {icon && (
                <Iconz name={icon} size={iconSize} fillTheme={iconFill} />
              )}
            </Pressable>
          ) : null
        ) : (
          content
        )}
      </View>
      {isValidString(subtitle) && <Text color="Secondary">{subtitle}</Text>}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingRight: 24,
    paddingLeft: 24,
    paddingVertical: 12,
  },
  containerWithoutPadding: {
    paddingRight: 0,
    paddingLeft: 0,
    paddingVertical: 12,
  },
  icon: {
    width: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  containerWithoutVerticalPadding: {
    paddingVertical: 0,
  },
  upper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "space-between",
    width: "100%",
  },
  flex: {
    flex: 1,
  },
});

export default SectionTitle;
