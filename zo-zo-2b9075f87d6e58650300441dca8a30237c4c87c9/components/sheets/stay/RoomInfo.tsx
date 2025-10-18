import { Room } from "@/definitions/discover";
import { Sheet } from "@/components/sheets";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { StyleSheet, View } from "react-native";
import { memo } from "react";
import RoomCardCarousel from "@/components/helpers/stay/RoomCarousel";
import SectionTitle from "@/components/ui/SectionTitle";
import Text from "@/components/ui/Text";
import Divider from "@/components/ui/Divider";
import SafeAreaView from "@/components/ui/SafeAreaView";
import { Amenity, RenderHTMLText } from "@/components/ui";

interface RoomInfoSheetProps {
  isOpen: boolean;
  onClose: () => void;
  operator: Room;
  onGalleryPress: () => void;
}

const RoomInfoSheet = memo(
  ({ isOpen, onClose, operator, onGalleryPress }: RoomInfoSheetProps) => {
    return (
      <Sheet snapPoints={["90%"]} isOpen={isOpen} onDismiss={onClose} disableContentDragForAndroid>
        <BottomSheetScrollView
          style={styles.container}
          contentContainerStyle={styles.list}
        >
          <View style={styles.carousel}>
            <RoomCardCarousel
              images={operator.images}
              aspectRatio={312 / 280}
              w="m"
              onPress={onGalleryPress}
            />
          </View>
          <SectionTitle noHorizontalPadding type="Title">
            {operator.name}
          </SectionTitle>
          <RenderHTMLText html={operator.description} />
          <Divider marginTop={24} marginBottom={8} />
          <SectionTitle noHorizontalPadding>Amenities</SectionTitle>
          <View style={styles.amenities}>
            {operator.amenities.map((am) => (
              <Amenity amenity={am} key={am.id} />
            ))}
          </View>
          <SafeAreaView safeArea="bottom" />
        </BottomSheetScrollView>
      </Sheet>
    );
  }
);

export default RoomInfoSheet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 24,
  },
  carousel: {
    aspectRatio: 312 / 280,
    overflow: "hidden",
    borderRadius: 16,
    borderCurve: "continuous",
    marginBottom: 8,
    width: "100%",
  },
  amenities: {
    marginTop: 8,
    gap: 16,
  },
});
