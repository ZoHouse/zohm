import { View, Share, StyleSheet } from "react-native";
import React, { useEffect, useRef } from "react";
import { Operator } from "@/definitions/discover";
import { StayBooking } from "@/definitions/booking";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import useProfile from "@/hooks/useProfile";
import { getCheckinInfo } from "@/utils/checkin";
import ViewShot, { captureRef } from "react-native-view-shot";
import device from "@/config/Device";
import { Button, Iconz, Pressable, SafeAreaView, Text } from "@/components/ui";
import helpers from "@/utils/styles/helpers";
import { StayConfirmedCard } from "../stay";
import StayConfirmedCardHolder from "./StayConfirmedCardHolder";
import StayStamp from "./StayStamp";

interface FinishedCheckinViewProps {
  booking?: StayBooking;
  operator: Operator;
  onClose: () => void;
}

const getShareMessage = (
  destination: string,
  operatorCode: string,
  bookingCode: string
) => {
  const webCheckinLink = `https://www.zostel.com/checkin/${operatorCode}/${bookingCode}?utm_source=app-share&utm_medium=app-share`;
  return `Our ${destination} trip is almost here! 🌟 Quick heads-up—complete your web check-in now so we can skip the hassle and focus on exploring and chilling. See you soon! 😎🔥

Just tap the link below—it only takes a few seconds! 🚀

${webCheckinLink}`;
};

const FinishedCheckinView = ({
  booking,
  operator,
  onClose,
}: FinishedCheckinViewProps) => {
  const operatorName = operator?.name;
  const destination = operator?.destination?.name;
  const image = operator?.images?.[0]?.image;

  const cardScale = useSharedValue(1);
  const cardY = useSharedValue(-500);
  const stampOpacity = useSharedValue(0);
  const stampScale = useSharedValue(1.2);
  const contentOpacity = useSharedValue(0);
  const contentY = useSharedValue(30);

  const stampStyle = useAnimatedStyle(() => {
    return {
      opacity: stampOpacity.value,
      transform: [{ scale: stampScale.value }],
    };
  });

  const cardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: cardScale.value },
        { translateX: 20 },
        { translateY: cardY.value },
      ],
    };
  });

  const contentStyle = useAnimatedStyle(() => {
    return {
      opacity: contentOpacity.value,
      transform: [{ translateY: contentY.value }],
    };
  });

  useEffect(() => {
    contentY.value = withDelay(300, withSpring(0, { dampingRatio: 1 / 3 }));
    contentOpacity.value = withDelay(
      300,
      withTiming(1, { duration: 100 }, () => {
        cardScale.value = withDelay(500, withTiming(0.9, { duration: 100 }));
        cardY.value = withDelay(
          500,
          withTiming(24, { duration: 250 }, () => {
            stampOpacity.value = withDelay(
              100,
              withTiming(1, { duration: 100 })
            );
            stampScale.value = withDelay(100, withTiming(1, { duration: 100 }));
          })
        );
      })
    );
  }, []);

  const { zostelProfile } = useProfile();
  const { guestCheckinMessage } = getCheckinInfo(booking, zostelProfile, true);

  const viewRef = useRef<ViewShot>(null);

  const onShare = () => {
    captureRef(viewRef, {
      format: "jpg",
      quality: 0.8,
    }).then(
      (url) => {
        const message = getShareMessage(
          destination,
          operator.code,
          booking?.code ?? ""
        );
        Share.share({
          url,
          message,
        });
      },
      (error) => console.error("Oops, snapshot failed", error)
    );
  };

  return (
    <SafeAreaView safeArea style={styles.screen}>
      <Pressable style={styles.cross} onPress={onClose}>
        <Iconz name="cross" size={24} fill="#fff" />
      </Pressable>
      <View style={styles.flexCenter}>
        <Animated.View style={[styles.center, contentStyle]}>
          <Iconz
            name="check-circle"
            size={40}
            fill="#fff"
            style={styles.check}
          />
          <Text type="Title" center style={styles.title}>
            Web Check-in to {operatorName} done.
          </Text>
        </Animated.View>
        <View style={styles.centerAnimationCard}>
          <Animated.View
            entering={FadeIn.delay(100)}
            style={[styles.abs, cardStyle]}
          >
            <StayConfirmedCard destination={destination} image={image} />
          </Animated.View>
          <StayConfirmedCardHolder style={styles.holder} />
          <Animated.View style={[styles.stamp, stampStyle]}>
            <StayStamp />
          </Animated.View>
        </View>
        <View style={styles.space} />
        {booking ? (
          <Animated.View style={styles.fullW} entering={FadeIn.delay(1000)}>
            {booking.guests.length === 1 ? null : (
              <Text center type="Subtitle" style={styles.guestText}>
                {guestCheckinMessage}
              </Text>
            )}
            {booking.guests.length === 1 ? (
              <Button style={styles.share} onPress={onClose}>
                Back to my Booking
              </Button>
            ) : (
              <Button style={styles.share} onPress={onShare}>
                Share Check-in Link
              </Button>
            )}
          </Animated.View>
        ) : (
          <Animated.View style={styles.fullW} entering={FadeIn.delay(1000)}>
            <Button style={styles.share} onPress={onShare}>
              Share Check-in Link
            </Button>
          </Animated.View>
        )}
      </View>
      <View style={styles.hidden}>
        <ViewShot ref={viewRef}>
          <SharedInvite
            destination={destination}
            image={image}
            operator={operatorName}
          />
        </ViewShot>
      </View>
    </SafeAreaView>
  );
};

export default FinishedCheckinView;

const styles = StyleSheet.create({
  hidden: { position: "absolute", top: device.WINDOW_HEIGHT },
  fullW: { width: "100%" },
  guestText: {
    color: "white",
    marginBottom: 8,
  },
  share: {
    marginBottom: 16,
  },
  space: {
    flex: 1,
  },
  stamp: {
    position: "absolute",
    right: 0,
    bottom: 0,
  },
  holder: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  abs: {
    position: "absolute",
  },
  centerAnimationCard: {
    width: 240,
    height: 310,
    marginTop: 40,
    alignItems: "flex-end",
    justifyContent: "flex-end",
  },
  title: { color: "#fff", margin: 16 },
  check: { marginTop: 24 },
  center: { alignItems: "center", justifyContent: "center" },
  flexCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  cross: { marginTop: 8, padding: 8 },
  screen: {
    ...helpers.absoluteEnds,
    backgroundColor: "#F1563F",
    paddingHorizontal: 16,
  },
  // ---
  whiteText: {
    color: "#fff",
  },
  rotate: {
    transform: [{ rotate: "-4deg" }],
  },
  container: {
    backgroundColor: "#F1563F",
    padding: 40,
    gap: 40,
    justifyContent: "center",
    alignItems: "center",
  },
});

const SharedInvite = ({
  destination,
  image,
  operator,
}: {
  destination: string;
  image: string;
  operator: string;
}) => {
  return (
    <View style={styles.container}>
      <Text type="SectionTitle" style={styles.whiteText} center>
        You're invited to {"\n"}
        {operator}
      </Text>
      <View style={styles.rotate}>
        <StayConfirmedCard destination={destination} image={image} />
      </View>
    </View>
  );
};
