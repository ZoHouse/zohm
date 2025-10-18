import { StyleSheet, Text, View } from "react-native";
import React from "react";
import Iconz from "@/components/ui/Iconz";
import StayConfirmedBackground from "./StayConfirmedBackground";
import ZoImage from "../../ui/ZoImage";

const StayConfirmedCard = ({
  destination,
  image,
}: {
  destination: string;
  image: string;
}) => {
  return (
    <View>
      <StayConfirmedBackground />
      <View style={styles.confirmedCard}>
        <View style={styles.confirmedContent}>
          <Text style={styles.destinationTitle}>{destination}</Text>
          <View style={styles.operatorImage}>
            <ZoImage url={image} width="sm" />
          </View>
          <View style={styles.zoTitleLogo}>
            <Iconz name="zostel" size={24} theme="Background.Zostel" />
          </View>
        </View>
      </View>
    </View>
  );
};

export default StayConfirmedCard;

const styles = StyleSheet.create({
  confirmedContent: {
    width: "100%",
    height: "100%",
    gap: 4,
  },
  confirmedCard: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 32,
    paddingTop: 24,
  },
  operatorImage: {
    flex: 1,
    alignSelf: "stretch",
    borderRadius: 0,
  },
  destinationTitle: {
    color: "#111",
    fontSize: 24,
    fontFamily: "Kalam-Bold",
  },
  zoTitleLogo: { position: "absolute", top: 4, right: 0 },
});
