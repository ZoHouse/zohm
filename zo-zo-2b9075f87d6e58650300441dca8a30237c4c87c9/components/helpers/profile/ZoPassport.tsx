import { StyleSheet, View } from "react-native";
import React from "react";
import helpers from "@/utils/styles/helpers";
import Text from "@/components/ui/Text";
import Pressable from "@/components/ui/Pressable";
import Avatar from "@/components/ui/Avatar";
import Icon from "@/components/ui/Iconz";
import ProgressBar from "@/components/ui/ProgressBar";
import { Image } from "expo-image";
import constants from "@/utils/constants";

const passportFounderSource = {
  uri: constants.assetURLS.passportFounder,
};
const passportSource = {
  uri: constants.assetURLS.passport,
};

const ZoPassportFounder = ({
  avatar,
  name,
  done,
  total,
  placeholder,
  onPress,
}: {
  avatar: string;
  name: string;
  done: number;
  total: number;
  placeholder: string;
  onPress: () => void;
}) => {
  return (
    <View style={styles.founderPassportContainer}>
      <Image
        source={passportFounderSource}
        style={styles.backgroundImage}
        contentFit="contain"
      />
      <View style={styles.overlayContainer}>
        <ProgressBar size={140} current={done} total={total} />
      </View>
      <View style={styles.overlayContainer}>
        <Avatar uri={avatar} size={120} alt={name} />
        <View style={styles.founderBadgeContainer}>
          <Icon name="founder-badge" size={32} noFill />
        </View>
      </View>
      <View style={styles.spacer} />
      <View style={styles.textContainer}>
        {name ? (
          <Text
            minimumFontScale={1 / 2}
            numberOfLines={1}
            adjustsFontSizeToFit
            center
            type="Title"
            style={styles.founderText}
          >
            {name}
          </Text>
        ) : (
          <Pressable activeOpacity={0.8} onPress={onPress}>
            <Text
              minimumFontScale={1 / 2}
              numberOfLines={1}
              adjustsFontSizeToFit
              center
              type="Title"
              style={styles.placeholderText}
            >
              {placeholder}
            </Text>
          </Pressable>
        )}
        <Text center type="Tertiary" style={styles.founderText}>
          Founder of Zo World
        </Text>
      </View>
    </View>
  );
};

const ZoPassport = ({
  avatar,
  name,
  founder,
  done,
  total,
  placeholder,
  onPress,
}: {
  avatar?: string;
  name: string;
  founder?: boolean;
  done: number;
  total: number;
  placeholder: string;
  onPress: () => void;
}) => {
  if (founder)
    return (
      <ZoPassportFounder
        avatar={avatar ?? ""}
        name={name}
        done={done}
        total={total}
        placeholder={placeholder}
        onPress={onPress}
      />
    );

  return (
    <View style={styles.passportContainer}>
      <Image
        source={passportSource}
        style={styles.backgroundImage}
        contentFit="contain"
      />
      <View style={styles.overlayContainer}>
        <ProgressBar size={140} current={done} total={total} />
      </View>
      <View style={styles.overlayContainer}>
        <Avatar uri={avatar ?? ""} size={120} alt={name} />
      </View>
      <View style={styles.spacer} />
      <View style={styles.textContainer}>
        {name ? (
          <Text
            minimumFontScale={1 / 2}
            numberOfLines={1}
            adjustsFontSizeToFit
            center
            type="Title"
            style={styles.text}
          >
            {name}
          </Text>
        ) : (
          <Pressable activeOpacity={0.8} onPress={onPress}>
            <Text
              minimumFontScale={1 / 2}
              numberOfLines={1}
              adjustsFontSizeToFit
              center
              type="Title"
              style={styles.placeholderText}
            >
              {placeholder}
            </Text>
          </Pressable>
        )}
        <Text center type="Tertiary" style={styles.text}>
          Citizen of Zo World
        </Text>
      </View>
    </View>
  );
};

export default ZoPassport;

const styles = StyleSheet.create({
  passportContainer: {
    width: 234,
    height: 300,
    alignSelf: "center",
    shadowColor: "#F1563F",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  founderPassportContainer: {
    width: 234,
    height: 300,
    alignSelf: "center",
    shadowColor: "black",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  founderText: {
    color: "white",
  },
  text: {
    color: "#111",
  },
  placeholderText: {
    color: "#11111170",
  },
  backgroundImage: {
    position: "absolute",
    ...helpers.fit,
    overflow: "hidden",
    borderBottomRightRadius: 20,
    borderTopRightRadius: 20,
  },
  spacer: {
    flex: 1,
  },
  textContainer: {
    padding: 24,
    gap: -4,
  },
  overlayContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  founderBadgeContainer: {
    position: "absolute",
    bottom: 84,
    right: 60,
  },
});
