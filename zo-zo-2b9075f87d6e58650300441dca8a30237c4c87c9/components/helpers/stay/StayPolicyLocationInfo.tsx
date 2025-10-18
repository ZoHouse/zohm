import React, { memo, useCallback, useMemo } from "react";
import { Operator } from "@/definitions/discover";
import { Linking, ScrollView, StyleSheet, View } from "react-native";
import CancellationPolicySheet from "../../sheets/stay/CancellationPolicy";
import SectionTitle from "@/components/ui/SectionTitle";
import useVisibilityState from "@/hooks/useVisibilityState";
import HTMLSheet from "@/components/sheets/HTMLSheet";
import Pressable from "@/components/ui/Pressable";
import Text from "@/components/ui/Text";
import Iconz from "@/components/ui/Iconz";
import { Image } from "expo-image";
import Chip from "@/components/ui/Chip";
import ActionsSheet from "../../sheets/ActionsSheet";
import RenderHTMLText from "@/components/ui/RenderHTMLText";
import Divider from "@/components/ui/Divider";
import { useTheme } from "@/context/ThemeContext";
import { getMapSheetOptions } from "@/utils/map";

const StayPoliciyLocationInfo = ({
  operator,
  checkin,
  amount,
  showContactUs = true,
  showGeneralPolicy = true,
  showCancellationPolicy = true,
}: {
  operator: Operator;
  checkin: string;
  amount?: number;
  showContactUs?: boolean;
  showGeneralPolicy?: boolean;
  showCancellationPolicy?: boolean;
}) => {
  return (
    <View style={styles.container}>
      <StayLocationSection operator={operator} />
      {showContactUs && (
        <>
          <Divider />
          <ContactUs operator={operator} />
        </>
      )}
      {showGeneralPolicy && (
        <>
          <Divider />
          <GeneralPolicy policy={operator.policy} />
        </>
      )}

      {showCancellationPolicy && (
        <>
          <Divider />
          <CancellationPolicy
            operator={operator}
            checkinDate={checkin}
            amount={amount}
          />
        </>
      )}
    </View>
  );
};

interface StayLocationProps {
  latitude: number;
  longitude: number;
  onPress: () => void;
}

const StayLocationSection = ({ operator }: { operator: Operator }) => {
  const [isSheetOpen, showSheet, hideSheet] = useVisibilityState(false);
  const [isMapOptionsOpen, showMapOptions, hideMapOptions] =
    useVisibilityState(false);

  const mapOptions = useMemo(() => getMapSheetOptions(operator), [operator]);

  return (
    <View style={styles.locationSection}>
      <View>
        <View style={styles.locationTitleBar}>
          <Text type="SectionTitle">Location</Text>
          <Pressable onPress={showMapOptions}>
            <Chip curve={100} stroke="Primary" style={styles.viewOnMap}>
              <Text type="TertiaryHighlight">View on Map 😃</Text>
            </Chip>
          </Pressable>
        </View>
        <RenderHTMLText
          html={operator.address}
          type="Subtitle"
          color="Secondary"
        />
      </View>
      <StayLocation
        latitude={operator.latitude}
        longitude={operator.longitude}
        onPress={showSheet}
      />
      {isSheetOpen && (
        <HTMLSheet
          isOpen={isSheetOpen}
          onClose={hideSheet}
          html={operator.directions}
          title="How To Reach"
        />
      )}
      {isMapOptionsOpen && (
        <ActionsSheet
          isOpen={isMapOptionsOpen}
          onDismiss={hideMapOptions}
          items={mapOptions}
        />
      )}
    </View>
  );
};

const StayLocation = ({ latitude, longitude, onPress }: StayLocationProps) => {
  const { colorScheme } = useTheme();

  const source = useMemo(
    () => ({
      uri: `https://api.mapbox.com/styles/v1/mapbox/${
        colorScheme === "dark" ? "dark" : "outdoors"
      }-v11/static/pin-l-z+F1563F(${longitude},${latitude})/${longitude},${latitude},16,0/600x400@2x?access_token=pk.eyJ1Ijoiem93b3JsZCIsImEiOiJjbDE4YXBlejcwb3BoM2Rwbjlla3Yzbnl1In0.Imjo7GlytPQ70tmcuh13jQ&logo=false`,
    }),
    [latitude, longitude]
  );

  return (
    <Chip curve={16} stroke="Primary" style={styles.locationChip}>
      <Image source={source} contentFit="cover" style={styles.mapImage} />
      <Pressable
        onPress={onPress}
        activeOpacity={0.8}
        style={styles.howToReach}
      >
        <Text type="TextHighlight">How To Reach</Text>
        <Iconz name="downAngle" fillTheme="ViewOnly" size={16} />
      </Pressable>
    </Chip>
  );
};

interface GeneralPolicyProps {
  policy: string;
}

const GeneralPolicy = ({ policy }: GeneralPolicyProps) => {
  const [isSheetOpen, showSheet, hideSheet] = useVisibilityState(false);

  return (
    <>
      <SectionTitle
        iconSize={16}
        noHorizontalPadding
        iconFill="Primary"
        icon="downAngle"
        onPress={showSheet}
      >
        General Policy
      </SectionTitle>
      {isSheetOpen && (
        <HTMLSheet
          isOpen={isSheetOpen}
          onClose={hideSheet}
          html={policy}
          title="General Policy"
        />
      )}
    </>
  );
};

const CancellationPolicy = ({
  operator,
  checkinDate,
  amount,
}: {
  operator: Operator;
  checkinDate: string;
  amount?: number;
}) => {
  const [isSheetOpen, showSheet, hideSheet] = useVisibilityState(false);

  return (
    <>
      <SectionTitle
        iconSize={16}
        noHorizontalPadding
        iconFill="Primary"
        icon="downAngle"
        onPress={showSheet}
      >
        Cancellation Policy
      </SectionTitle>
      {isSheetOpen && (
        <CancellationPolicySheet
          isOpen={isSheetOpen}
          onDismiss={hideSheet}
          operator={operator}
          checkinDate={checkinDate}
        />
      )}
    </>
  );
};

const ContactUs = ({ operator }: { operator: Operator }) => {
  const openWhatsapp = useCallback(() => {
    const url = whatsappUrl(operator.name);
    Linking.openURL(url);
  }, [operator.name]);

  const openPhone = useCallback(() => {
    Linking.openURL(`tel:${operator.phone}`);
  }, [operator.phone]);

  return (
    <View style={styles.contactUsSection}>
      <SectionTitle noHorizontalPadding>Contact Us</SectionTitle>
      <ScrollView
        contentContainerStyle={styles.contactUsList}
        style={styles.hContactUsScroll}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <Pressable activeOpacity={0.8} onPress={openWhatsapp}>
          <Chip curve={100} stroke="Primary" style={styles.contactUsChip}>
            <Iconz name="whatsapp" noFill size={20} />
            <Text type="SubtitleHighlight">Whatsapp</Text>
          </Chip>
        </Pressable>
        {operator.phone && (
          <Pressable activeOpacity={0.8} onPress={openPhone}>
            <Chip curve={100} stroke="Primary" style={styles.contactUsChip}>
              <Text>📞</Text>
              <Text type="SubtitleHighlight">Call {operator.name}</Text>
            </Chip>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
};

const whatsappUrl = (name: string) =>
  `https://api.whatsapp.com/send?phone=919289229822&text=${encodeURIComponent(
    `Hi Zobu, I want to talk about ${name}!`
  )}`;

const styles = StyleSheet.create({
  howToReach: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mapImage: {
    width: "100%",
    aspectRatio: 312 / 220,
  },
  locationChip: { overflow: "hidden" },
  viewOnMap: { paddingVertical: 8, paddingHorizontal: 12 },
  locationSection: { gap: 24, marginBottom: 16 },
  locationTitleBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
  },
  container: { gap: 8 },
  contactUsSection: { gap: 0, marginBottom: 16 },
  contactUsList: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
  },
  hContactUsScroll: {
    marginHorizontal: -24,
  },
  contactUsChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});

export default memo(StayPoliciyLocationInfo);
