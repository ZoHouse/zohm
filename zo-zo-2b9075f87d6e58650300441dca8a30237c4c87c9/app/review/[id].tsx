import Text from "@/components/ui/Text";
import View from "@/components/ui/View";
import { useLocalSearchParams } from "expo-router";
import React from "react";

const ReviewDetailScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Review Detail Screen</Text>
      <Text>ID: {id}</Text>
    </View>
  );
};

export default ReviewDetailScreen;
