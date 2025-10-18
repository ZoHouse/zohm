import { HttpMethod } from "@/definitions/auth";
import { TripBookingInfo, TripInventory } from "@/definitions/trip";
import useMutation from "@/hooks/useMutation";
import useQuery from "@/hooks/useQuery";
import { useToggleState } from "@/utils/hooks";
import { logAxiosError } from "@/utils/network";
import { showToast } from "@/utils/toast";
import { getCurrenciedPrice } from "@/utils/trips";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import Sheet from "../Base";
import {
  Button,
  CheckBox,
  DashedBorder,
  Iconz,
  Loader,
  Pressable,
  SafeAreaView,
  SectionTitle,
  Text,
} from "@/components/ui";
import RadioFields from "@/components/ui/RadioFields";

interface TripCancellationProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripBookingInfo;
  seed: string[];
  onCancellationSuccess: () => void;
  showCP: () => void;
}

interface TripCancellationData {
  success: boolean;
  refund_amount: number;
  hours_till_start: number;
  refunds: TripBookingInfo['payments']
}

const TripCancellation = ({
  isOpen,
  onClose,
  trip,
  seed,
  onCancellationSuccess,
  showCP,
}: TripCancellationProps) => {
  const options = useMemo(
    () => seed.map((value, index) => ({ id: `${index}`, title: value })),
    [seed]
  );
  const [selected, select] = useState<string>();
  const [reviewMode, setReviewMode] = useState(false);
  const [refundToCredits, toggleRefundToCredits] = useToggleState(false);

  const onCancellationFetchError = useCallback(
    (e: Error) => {
      logAxiosError(e);
      showToast({
        message: "Unable to process, try again later.",
        type: "error",
      });
      onClose();
    },
    [onClose]
  );

  const onSuccess = useCallback(() => {
    onCancellationSuccess();
    showToast({
      message: "Any amount deducted will be refunded in 5 business days.",
      type: "success",
    });
  }, [onCancellationSuccess]);

  const { data: cancellationData, isLoading, error } = useQuery<
    "TRIP_BOOKING",
    TripCancellationData,
    TripCancellationData
  >(
    "TRIP_BOOKING",
    {
      select: (data) => data.data,
      throwOnError: (er) => {
        logAxiosError(er);
        return false;
      },
    },
    {
      path: ["bookings", trip.pid, "cancellation-details"],
      search: {
        refund_in_credits: refundToCredits ? "true" : "false",
      },
    }
  );

  useEffect(() => {
    if (error) {
      onCancellationFetchError(error);
    }
  }, [error]);

  const { mutateAsync: cancel, isPending: isCancellationLoading } = useMutation<
    "BOOKINGS_TRIPS",
    { reason: string; refund_in_credits: boolean }
  >("BOOKINGS_TRIPS");

  const cancelPartial = useCallback(() => {
    if (!trip.whatsapp_number) return;
    if (trip.whatsapp_number.startsWith("http")) {
      Linking.openURL(trip.whatsapp_number);
    } else {
      Linking.openURL(`https://wa.me/${trip.whatsapp_number}`);
    }
  }, [trip]);

  const cancelBooking = useCallback(() => {
    const reason = options.find((el) => el.id === selected)?.title ?? "N/A";
    cancel(
      {
        reason,
        refund_in_credits: refundToCredits,
        path: `${trip.pid}/cancel/`,
        method: HttpMethod.PUT,
      },
      {
        onError: logAxiosError,
        onSuccess,
      }
    );
  }, [cancel, selected, trip, onSuccess, options, refundToCredits]);

  const [total, refund, charges] = useMemo(() => {
    if (!cancellationData) return [];
    return [
      getCurrenciedPrice(trip.total_amount, trip.currency),
      getCurrenciedPrice(cancellationData.refund_amount, trip.currency),
      getCurrenciedPrice(
        trip.total_amount - cancellationData.refund_amount,
        trip.currency
      ),
    ];
  }, [cancellationData, trip]);

  const refundBreakDown = useMemo(() => {
    if (!cancellationData) return [];
    const result: {
      amount: string;
      title: string;
    }[] = [];

    const balances = {
      bank: 0,
      credits: 0
    };

    cancellationData.refunds.forEach((refund) => {
      if (!refund.amount) return;
      if (refund.payment_mode === "credits") {
        balances.credits += refund.amount
      } else if (refund.payment_mode === "gateway") {
        balances.bank += refund.amount;
      }
    });
    if (balances.bank) {
      result.push({
        title: "Refund to Account",
        amount: getCurrenciedPrice(balances.bank, trip.currency),
      });
    }
    if (balances.credits) {
      result.push({
        title: "Refund to Credits",
        amount: getCurrenciedPrice(balances.credits, trip.currency),
      });
    }
    return result;
  }, [cancellationData, trip.currency])

  return (
    <Sheet snapPoints={["90%"]} isOpen={isOpen} onDismiss={onClose}>
      <SafeAreaView safeArea="bottom" style={styles.flex}>
        {isLoading ? (
          <View style={styles.loader}>
            <Loader />
          </View>
        ) : !reviewMode ? (
          <>
            <View style={styles.screen}>
              <Iconz
                size={24}
                fillTheme="Primary"
                name="cross"
                onPress={onClose}
              />
              <SectionTitle type="Title" noHorizontalPadding>
                Why are you cancelling your stay?
              </SectionTitle>
              <RadioFields
                items={options}
                selected={selected}
                onSelect={select}
                itemStyle={styles.radioItem}
                style={styles.radioContainer}
              />
              <View style={styles.buttonContainer}>
                <Button
                  onPress={setReviewMode.bind(null, true)}
                  isDisabled={!selected}
                >
                  Review Refund
                </Button>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.screen}>
            <Pressable
              onPress={setReviewMode.bind(null, false)}
              style={styles.nav}
            >
              <Iconz size={24} fillTheme="Primary" name="arrow-left" />
            </Pressable>
            <SectionTitle type="Title" noHorizontalPadding>
              Refund & cancellation charges
            </SectionTitle>
            <View style={styles.info}>
              <View style={styles.row}>
                <Text style={styles.flex}>Stay total</Text>
                <Text>{total}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.flex}>
                  Charges as per{" "}
                  <Text onPress={showCP} style={styles.underline}>
                    Cancellation Policy
                  </Text>
                </Text>
                <Text>- {charges}</Text>
              </View>
              <DashedBorder />
              <View style={styles.row}>
                <Text type="TextHighlight">Total Refund</Text>
                <Text type="TextHighlight">{refund}</Text>
              </View>
              {refundBreakDown.map((rb, index) => (
                <View style={styles.row} key={`${rb.title}-${index}`}>
                  <Text>{rb.title}</Text>
                  <Text type="TextHighlight">{rb.amount}</Text>
                </View>
              ))}
            </View>
            <View style={styles.buttonContainer}>
              <Pressable
                style={styles.refundRow}
                activeOpacity={0.8}
                onPress={toggleRefundToCredits}
                disabled={isCancellationLoading}
              >
                <CheckBox size={16} isSelected={refundToCredits} />
                <Text type="Subtitle">Refund to Credits</Text>
              </Pressable>
              <Button
                onPress={cancelBooking}
                isLoading={isCancellationLoading}
                isDisabled={!reviewMode}
              >
                Zo Zo Zo! Cancel Booking
              </Button>
              {trip.whatsapp_number ? (
                <Button
                  variant="secondary"
                  onPress={cancelPartial}
                  isDisabled={!reviewMode}
                >
                  Partial Cancellation
                </Button>
              ) : null}
            </View>
          </View>
        )}
      </SafeAreaView>
    </Sheet>
  );
};

export default TripCancellation;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  buttonContainer: {
    flex: 1,
    justifyContent: "flex-end",
    marginVertical: 24,
    gap: 8,
  },
  screen: {
    paddingHorizontal: 24,
    flex: 1,
    paddingVertical: 8,
  },
  underline: { textDecorationLine: "underline" },
  questions: { gap: 8, marginVertical: 16 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 24,
  },
  info: { gap: 16, marginVertical: 16 },
  loader: { margin: 48, justifyContent: "center", alignItems: "center" },
  hideHandle: { opacity: 0 },
  nav: {
    marginBottom: 8,
  },
  refundRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "flex-start",
    marginBottom: 8,
  },
  radioItem: {
    paddingVertical: 8,
  },
  radioContainer: {
    marginVertical: 16,
  },
});
