import moment from "moment";
import { Sheet } from "@/components/sheets";
import { BottomSheetScrollView, BottomSheetView } from "@gorhom/bottom-sheet";
import { Linking, StyleSheet, View } from "react-native";
import constants from "@/utils/constants";
import { memo, useCallback } from "react";
import {
  SafeAreaView,
  SectionTitle,
  Text,
  View as Ziew,
  Button,
  Divider,
} from "@/components/ui";
import useVisibilityState from "@/hooks/useVisibilityState";
import Animated, { FadeIn } from "react-native-reanimated";
import useProfile from "@/hooks/useProfile";
import { getFullName } from "@/utils/profile";
import ZoImage from "@/components/ui/ZoImage";
import { MapOperator } from "@/definitions/zo";
import MapCardView from "@/components/helpers/map/MapCard";

interface MaxOccupancyProps {
  isOpen: boolean;
  onClose: () => void;
  max?: number;
  name: string;
  checkin: moment.Moment;
  checkout: moment.Moment;
  destinationName: string;
  nearOperators: MapOperator[];
}

type MaxOccupancyParentProps = MaxOccupancyProps & {
  groupBookingAllowed?: boolean;
}

const MaxOccupancyParent = (props: MaxOccupancyParentProps) => {
  if (props.groupBookingAllowed) {
    return <MaxOccupancy {...props} />;
  } else {
    if (props.nearOperators.length) {
      return (
        <NearByList
          isOpen={props.isOpen}
          onClose={props.onClose}
          destinationName={props.destinationName}
          max={props.max ?? 8}
          nearOperators={props.nearOperators}
        />
      );
    } else {
      return <MaxOccupancy {...props} hideFooter />;
    }
  }
};

const MaxOccupancy = ({
  isOpen,
  onClose,
  max,
  name,
  checkin,
  checkout,
  hideFooter,
}: MaxOccupancyProps & { hideFooter?: boolean }) => {
  const [isShowing, show] = useVisibilityState(false);

  const { profile } = useProfile();

  const onShare = useCallback(() => {
    const zostelName = name.toLocaleLowerCase().replaceAll(" ", "_");
    const userName = getFullName(profile);
    const number = profile?.mobile_number;
    const email = profile?.email_address;
    let url = `https://zostel.typeform.com/to/oqSUSaBw#zostel=${zostelName}&number=${number}&email=${email}&name=${encodeURI(
      userName
    )}`;
    if (checkin && checkout) {
      const checkinDate = moment(checkin).format("DD-MM-YYYY");
      const checkoutDate = moment(checkout).format("DD-MM-YYYY");
      url += `&checkin=${checkinDate}&checkout=${checkoutDate}`;
    }
    Linking.openURL(url);
  }, [name, profile, checkin, checkout]);

  return (
    <Sheet
      isOpen={isOpen}
      onDismiss={onClose}
      enableDynamicSizing
      maxDynamicContentSize={700}
    >
      <BottomSheetView style={styles.ph}>
        <View>
          <SectionTitle noHorizontalPadding type="Title">
            Travelling in a group?
          </SectionTitle>
          <View style={styles.groupImage}>
            <ZoImage url={constants.assetURLS.zobuGroup} width="sm" />
          </View>
          <Text center type="Subtitle">
            Max {max} guests per booking allowed.{" "}
            <Text style={styles.underline} type="Subtitle" onPress={show}>
              Why?
            </Text>
          </Text>
          {isShowing && (
            <Animated.View entering={FadeIn}>
              <Ziew background="Input" style={styles.info}>
                <Text type="Subtitle" color="Secondary">
                  At Zostel, we celebrate solo trips & chance connections. One's
                  a seeker, two's company, three's a memory. {max}? That's the
                  start of a reality show.{"\n\n"}To keep the magic alive for
                  all, groups of {max} get curated differently. Drop your
                  details, & we'll help out.
                </Text>
              </Ziew>
            </Animated.View>
          )}
          {hideFooter ? null : (
            <Text
              style={styles.lowText}
              center
              type="Subtitle"
              color="Secondary"
            >
              For larger groups, please share details.
            </Text>
          )}
        </View>
        {hideFooter ? null : <Button onPress={onShare}>Share Details</Button>}
        <SafeAreaView safeArea="bottom" />
      </BottomSheetView>
    </Sheet>
  );
};

const NearByList = ({
  isOpen,
  onClose,
  max,
  destinationName,
  nearOperators,
}: {
  isOpen: boolean;
  onClose: () => void;
  max: number;
  destinationName: string;
  nearOperators: MapOperator[];
}) => {
  const [isShowing, show] = useVisibilityState(false);

  return (
    <Sheet
      isOpen={isOpen}
      onDismiss={onClose}
      enableDynamicSizing
      maxDynamicContentSize={700}
    >
      <BottomSheetScrollView
        style={styles.ph}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gap}>
          <SectionTitle noHorizontalPadding type="Title">
            Travelling in a group?
          </SectionTitle>
          <Text type="Subtitle">
            Groups larger than{" "}
            <Text type="SubtitleHighlight">{max} guests</Text> are not allowed
            at this Zostel to keep the stay comfortable for everyone.{" "}
            <Text style={styles.underline} type="Subtitle" onPress={show}>
              Why?
            </Text>
          </Text>
          {isShowing && (
            <Animated.View entering={FadeIn}>
              <Ziew background="Input" style={styles.info}>
                <Text type="Subtitle" color="Secondary">
                  At Zostel, we celebrate solo trips & chance connections. One's
                  a seeker, two's company, three's a memory. {max}? That's the
                  start of a reality show.{"\n\n"}To keep the magic alive for
                  all, groups of {max} get curated differently. Drop your
                  details, & we'll help out.
                </Text>
              </Ziew>
            </Animated.View>
          )}
          <Divider marginTop={16} />
          <SectionTitle
            noHorizontalPadding
            children={`Stays and Trips near ${destinationName}, that allow group bookings`}
          />
          <View style={styles.groupList}>
            {nearOperators.map((operator) => (
              <MapCardView
                key={operator.code}
                operator={operator}
                hideLogo
                onPrePress={onClose}
              />
            ))}
          </View>
        </View>
        <SafeAreaView safeArea="bottom" />
      </BottomSheetScrollView>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  groupImage: {
    aspectRatio: 312 / 128,
    width: "100%",
    marginBottom: 16,
    marginTop: 8,
  },
  info: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginHorizontal: -24,
    marginTop: 8,
  },
  lowText: { marginVertical: 8 },
  underline: { textDecorationLine: "underline" },
  ph: { paddingHorizontal: 24 },
  groupList: {
    paddingTop: 8,
    paddingBottom: 16,
    gap: 16,
  },
  gap: { gap: 8 },
});

export default memo(MaxOccupancyParent);
