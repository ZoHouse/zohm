import {
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import React, { JSX, useMemo } from "react";
import SafeAreaView from "./SafeAreaView";
import Ziew from "./View";
import GradientHeader from "./GradientHeader";

interface ListViewProps extends ScrollViewProps {
  navContent?: JSX.Element;
  extraContent?: JSX.Element;
  screenStyle?: ViewStyle;
  navGradientColors?: string[];
}

const ListView = ({
  contentContainerStyle,
  navContent,
  children,
  extraContent,
  screenStyle,
  navGradientColors,
  ...props
}: ListViewProps) => {
  const style = useMemo(() => [styles.flex, screenStyle], [screenStyle]);
  const listStyle = useMemo(
    () => [styles.scrollContent, contentContainerStyle],
    [contentContainerStyle]
  );

  return (
    <Ziew style={styles.flex} background>
      <SafeAreaView safeArea="top" style={style}>
        <View style={styles.flex}>
          <GradientHeader
            horizontalPadding
            colors={navGradientColors}
            children={navContent}
          />
          <View style={styles.absoluteFlex}>
            <ScrollView
              contentContainerStyle={listStyle}
              showsVerticalScrollIndicator={false}
              {...props}
            >
              {children}
            </ScrollView>
            {extraContent}
          </View>
        </View>
      </SafeAreaView>
    </Ziew>
  );
};

export default ListView;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  absoluteFlex: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
  },
  scrollContent: { paddingVertical: 56 },
});
