import { StyleSheet, View } from "react-native";
import React from "react";
import { Operator } from "@/definitions/discover";
import Text from "./Text";
import AmenityIcon from "./AmenityIcon";

interface AmenityProp {
  amenity: Operator["amenities"][number];
}

const Amenity = ({ amenity }: AmenityProp) => {
  return (
    <View style={styles.amenity}>
      <AmenityIcon name={String(amenity.id)} size={16} />
      <Text>{amenity.name}</Text>
    </View>
  );
};

export default Amenity;

const styles = StyleSheet.create({
  amenity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    justifyContent: "flex-start",
  },
});
