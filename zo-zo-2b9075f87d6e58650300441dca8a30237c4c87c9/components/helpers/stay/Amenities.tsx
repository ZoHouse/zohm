import { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import AmenitiesSheet from "@/components/sheets/stay/Amenities";
import { Amenity, Pressable, Text } from "@/components/ui";
import { Operator } from "@/definitions/discover";
import useVisibilityState from "@/hooks/useVisibilityState";

const Amenities = memo(
  ({ amenities }: { amenities: Operator["amenities"] }) => {
    const [isSheetOpen, showSheet, hideSheet] = useVisibilityState(false);

    const amenitiesToShow = useMemo(() => {
      return amenities.slice(0, 6);
    }, [amenities]);

    return (
      <View style={styles.container}>
        {amenitiesToShow.map((amenity) => (
          <Amenity key={amenity.id} amenity={amenity} />
        ))}
        {amenities.length > 6 && (
          <Pressable style={styles.seeAll} onPress={showSheet}>
            <Text style={styles.seeAllText}>
              See All {amenities.length} Amenities
            </Text>
          </Pressable>
        )}
        {isSheetOpen && (
          <AmenitiesSheet
            isOpen={isSheetOpen}
            onClose={hideSheet}
            amenities={amenities}
          />
        )}
      </View>
    );
  }
);

export default memo(Amenities);

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  seeAll: {
    alignSelf: "flex-start",
  },
  seeAllText: {
    textDecorationLine: "underline",
  },
});
