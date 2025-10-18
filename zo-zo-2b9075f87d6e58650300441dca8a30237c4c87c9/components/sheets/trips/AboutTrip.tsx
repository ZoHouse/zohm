import { TripInventory, TripItinerary } from "@/definitions/trip";
import Sheet from "@/components/sheets/Base";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { View } from "react-native";
import { StyleSheet } from "react-native";
import helpers from "@/utils/styles/helpers";
import TripInfo from "@/components/helpers/trip/TripInfo";
import SafeAreaView from "@/components/ui/SafeAreaView";
import { Iconz, SectionTitle } from "@/components/ui";

interface AboutTripProps {
  isOpen: boolean;
  onDismiss: () => void;
  trip: TripInventory;
  itinerary: TripItinerary;
}

const AboutTrip = ({ isOpen, onDismiss, trip, itinerary }: AboutTripProps) => {
  return (
    <Sheet
      fullScreen
      isOpen={isOpen}
      onDismiss={onDismiss}
      hideHandle
      disableContentDragForAndroid
    >
      <BottomSheetScrollView
        style={helpers.flex}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView safeArea style={helpers.flex}>
          <View style={styles.header}>
            <Iconz
              name="cross"
              size={24}
              fillTheme="Primary"
              onPress={onDismiss}
            />
          </View>
          <SectionTitle noHorizontalPadding type="Title">
            {trip.name}
          </SectionTitle>
          <View style={styles.tripInfo}>
            <TripInfo
              cancellation_policies={trip.cancellation_policies}
              description={itinerary?.description ?? trip.description ?? ""}
              destinations={trip.destinations}
              drop_location={itinerary?.drop_location ?? trip.drop_location ?? ""}
              pickup_location={itinerary?.pickup_location ?? trip.pickup_location ?? ""}
              essentials={itinerary?.essentials ?? []}
              exclusions={itinerary?.exclusions ?? []}
              faqs={itinerary?.faqs ?? []}
              guest_policies={itinerary?.policies ?? []}
              highlights={itinerary?.highlights ?? []}
              inclusions={itinerary?.inclusions ?? []}
              stops={itinerary?.stops ?? []}
              local_map={trip.local_map}
            />
          </View>
        </SafeAreaView>
      </BottomSheetScrollView>
    </Sheet>
  );
};

export default AboutTrip;

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 24,
  },
  tripInfo: {
    paddingVertical: 16,
    gap: 8,
  },
  header: {
    alignItems: "flex-start",
    justifyContent: "center",
    height: 56,
  },
});
