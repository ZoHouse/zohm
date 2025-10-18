import React, { useCallback, useEffect, useMemo, useState } from "react";
import useQuery from "@/hooks/useQuery";
import { router, useLocalSearchParams, useRouter } from "expo-router";
import Ziew from "@/components/ui/View";
import { StayBooking } from "@/definitions/booking";
import { Linking, StyleSheet, View } from "react-native";
import SafeAreaView from "@/components/ui/SafeAreaView";
import Iconz from "@/components/ui/Iconz";
import useMutation from "@/hooks/useMutation";
import { logAxiosError } from "@/utils/network";
import { openRazorpay } from "@/components/helpers/misc/rzp";
import Text from "@/components/ui/Text";
import Loader from "@/components/ui/Loader";
import Button from "@/components/ui/Button";
import ZoImage from "@/components/ui/ZoImage";
import ConfirmSplash from "@/components/helpers/stay/ConfirmSplash";
import useVisibilityState from "@/hooks/useVisibilityState";
import constants from "@/utils/constants";

const PaymentScreen = () => {
  const { pid, slug, code, bypass } = useLocalSearchParams();
  const bookingId = (pid ?? slug ?? code) as string;
  const bypassPayment = bypass === "true";
  const { navigate } = useRouter();

  const { data: booking } = useQuery(
    "STAY_BOOKING",
    {
      select: (data) => data.data,
    },
    {
      path: [bookingId],
    }
  );

  const payment = useMemo(
    () =>
      booking?.payments.find(
        (p) =>
          p.status === "In Progress" &&
          p.payment_mode === "PG via Payment Gateway"
      ),
    [booking]
  );

  const [isSplashVisible, showSplash, hideSplash] = useVisibilityState(false);

  const afterSplash = useCallback(() => {
    hideSplash();
    navigate(`/booking/${bookingId}?from_payment=true`);
  }, [hideSplash, bookingId]);

  const onSuccess = useCallback(() => {
    showSplash();
  }, [showSplash]);

  useEffect(() => {
    if (bypassPayment) {
      showSplash();
    }
  }, [bypassPayment]);

  return (
    <Ziew background style={styles.container}>
      <SafeAreaView safeArea style={styles.container}>
        <View style={styles.header}>
          <Iconz
            name="arrow-left"
            size={24}
            fillTheme="Primary"
            onPress={router.back}
          />
        </View>
        {booking && payment && !bypassPayment ? (
          <PaymentView
            booking={booking}
            payment={payment}
            onSuccess={onSuccess}
          />
        ) : (
          <></>
        )}
      </SafeAreaView>
      {isSplashVisible && booking ? (
        <ConfirmSplash
          onClose={afterSplash}
          operatorName={booking?.operator.name}
          destination={booking?.operator.destination?.name}
          image={booking?.operator.images?.[0]?.image}
        />
      ) : null}
    </Ziew>
  );
};

const IMAGES = {
  retry: constants.assetURLS.paymentRetry,
  support: constants.assetURLS.paymentSupport,
};

const PaymentView = ({
  booking,
  payment,
  onSuccess,
}: {
  booking: StayBooking;
  payment: StayBooking["payments"][number];
  onSuccess: () => void;
}) => {
  const [error, setError] = useState<number>(0);
  const [loading, setLoading] = useState<string | undefined>();

  const { mutateAsync: processOrder } = useMutation(
    "ZOSTEL_PAYMENT_PROCESS_ORDER"
  );
  const { mutateAsync: postPaymentResponse } = useMutation(
    "ZOSTEL_PAYMENT_RESPONSE"
  );
  const { mutateAsync: postBookingPayments } = useMutation("BOOKINGS_PAYMENTS");

  const processPayment = useCallback(() => {
    setLoading("Crafting your experience...");
    processOrder(payment)
      .then((res) => res.data)
      .then((paymentResponse) => openRazorpay(paymentResponse))
      .then((result) => postPaymentResponse(result))
      .then((res) => res.data)
      .then((postBooking) => postBookingPayments(postBooking))
      .then(onSuccess)
      .catch((er) => {
        logAxiosError(er);
        setError((n) => n + 1);
      })
      .finally(() => {
        setLoading(undefined);
      });
  }, [
    booking,
    payment,
    postBookingPayments,
    postPaymentResponse,
    processOrder,
    onSuccess,
  ]);

  useEffect(() => {
    setLoading("Opening Payment Portal...");
    processPayment();
  }, [processPayment]);

  useEffect(() => {
    if (error > 2) {
      router.back();
    }
  }, [error])

  const openWhatsApp = useCallback(() => {
    Linking.openURL(
      `whatsapp://send?text=Zo%20Zo%20Zo%2C%20I%20am%20facing%20payment%20issues%20with%20my%20booking%20${
        booking.code
      }.%20Can%20you%20help%3F&phone=${919289229822}`
    );
  }, [booking.code]);

  return (
    <View style={styles.infoContainer}>
      {error ? (
        error === 1 ? (
          <View style={styles.viewContainer}>
            <View style={styles.errorContentContainer}>
              <View style={styles.image}>
                <ZoImage url={IMAGES.retry} width="s" />
              </View>
              <Text type="Title" style={styles.bigTitle}>
                Payment didn't go through
              </Text>
              <Text style={styles.text}>
                Sometimes banks or networks act up. Just hit retry to complete
                your booking.
              </Text>
            </View>
            <Button isLoading={!!loading} onPress={processPayment}>
              Retry Payment
            </Button>
          </View>
        ) : error === 2 ? (
          <View style={styles.viewContainer}>
            <View style={styles.errorContentContainer}>
              <View style={styles.image}>
                <ZoImage url={IMAGES.support} width="s" />
              </View>
              <Text type="Title" style={styles.bigTitle}>
                Payment failed due to some technical issue!
              </Text>
              <Text style={styles.text}>You can try again now or later</Text>
            </View>
            <Text style={styles.wa}>
              Have other issues?{" "}
              <Text
                color="ButtonSecondary"
                type="TextHighlight"
                onPress={openWhatsApp}
              >
                WhatsApp Us
              </Text>
            </Text>
            <Button isLoading={!!loading} onPress={processPayment}>
              Retry Payment
            </Button>
          </View>
        ) : null
      ) : loading ? (
        <View style={styles.loading}>
          <Loader width={64} height={64} />
          <Text type="SectionTitle">{loading}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    paddingLeft: 24,
  },
  infoContainer: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
  },
  text: {
    // ...Typography.Paragraph,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    // color: Colors.Text.Primary,
  },
  bigTitle: {
    // ...Typography.Title,
    textAlign: "center",
    paddingHorizontal: 16,
    // color: Colors.Text.Primary,
  },
  viewContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    justifyContent: "center",
    alignSelf: "stretch",
    paddingBottom: 8,
  },
  errorContentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 220,
    height: 220,
  },
  wa: {
    marginBottom: 8,
  },
});

export default PaymentScreen;
