import { Button, GradientFooter, Text } from "@/components/ui";
import {
  TripAvailability,
  TripInventory,
  TripItinerary,
  TripPricing,
} from "@/definitions/trip";
import { formatDates } from "@/utils/data-types/date";
import helpers from "@/utils/styles/helpers";
import { validatePrice, withCurrency } from "@/utils/trips";
import moment from "moment";
import { useCallback, useMemo } from "react";
import { Linking, Platform, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";

interface TripFooterProps {
  pricing: TripPricing;
  trip: TripInventory;
  slot: TripAvailability;
  itinerary: TripItinerary;
  onBook: () => void;
  isSoldOut: boolean;
  duration: number
}

const TripFooter = ({
  pricing,
  trip,
  slot,
  onBook,
  isSoldOut,
  itinerary,
  duration
}: TripFooterProps) => {

  const enquiryForm = itinerary.enquiry_form ?? trip.enquiry_form;
  const whatsappNumber = itinerary.whatsapp_number ?? trip.whatsapp_number;

  const selectedSlotText = useMemo(
    () =>
      `${formatDates(
        moment(slot.date),
        moment(slot.date).add(duration - 1, "day")
      )}`,
    [slot, duration]
  );

  const price = useMemo(() => {
    const validPrice = validatePrice(pricing);
    if (!validPrice) return null;
    return withCurrency(validPrice.price_taxed, validPrice.currency);
  }, [pricing]);

  const onSendEnquiry = useCallback(() => {
    if (!enquiryForm) return;
    Linking.openURL(enquiryForm);
  }, [enquiryForm]);

  const onSendWhatsapp = useCallback(() => {
    if (!whatsappNumber) return;
    if (whatsappNumber.startsWith("http")) {
      Linking.openURL(whatsappNumber);
    } else {
      Linking.openURL(`https://wa.me/${whatsappNumber}`);
    }
  }, [whatsappNumber]);

  return (
    <Animated.View
      key="footer"
      entering={FadeInDown.delay(100)}
      style={styles.footer}
    >
      <GradientFooter style={styles.gradient}>
        <View style={styles.footerContent}>
          <View style={styles.rowEndSpaced}>
            <Animated.View
              entering={FadeIn}
              exiting={FadeOut}
              key={selectedSlotText}
            >
              <Text>{selectedSlotText}</Text>
              <View style={styles.priceRow}>
                <Text type="TextHighlight">{price}</Text>
                <Text type="Tertiary" color="Secondary">
                  /person
                </Text>
              </View>
            </Animated.View>
            <View>
              {isSoldOut ? (
                <Button isDisabled style={styles.ph}>
                  Sold Out
                </Button>
              ) : (
                <Button style={styles.ph} onPress={onBook}>
                  Book Now
                </Button>
              )}
            </View>
          </View>
          <View style={styles.rowEndSpaced}>
            {whatsappNumber ? (
              <Text type="Tertiary">
                <Text
                  type="SmallButton"
                  style={styles.underline}
                  onPress={onSendWhatsapp}
                >
                  Whatsapp Zo
                </Text>{" "}
                For questions
              </Text>
            ) : (
              <View />
            )}
            {enquiryForm ? (
              <Text
                type="SmallButton"
                style={styles.underline}
                onPress={onSendEnquiry}
              >
                Send Enquiry
              </Text>
            ) : (
              <View />
            )}
          </View>
        </View>
      </GradientFooter>
    </Animated.View>
  );
};

export default TripFooter;

const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  gradient: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  footerContent: {
    ...helpers.fit,
    gap: 16,
    marginBottom: Platform.OS === "ios" ? 0 : 8,
  },
  underline: {
    textDecorationLine: "underline",
  },
  rowEndSpaced: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  ph: {
    paddingHorizontal: 24,
  },
});
