import {
  BookingCancellationError,
  BookingCancellationResponse,
} from "@/definitions/booking";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Sheet } from "@/components/sheets";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import useQuery from "@/hooks/useQuery";
import { useCurrency } from "@/context/CurrencyContext";
import { useToggleState } from "@/utils/hooks";
import { logAxiosError } from "@/utils/network";
import useMutation from "@/hooks/useMutation";
import { Keyboard, View, StyleSheet } from "react-native";
import helpers from "@/utils/styles/helpers";
import {
  SectionTitle,
  Loader,
  Text,
  View as Ziew,
  Divider,
  TextInput,
  Pressable,
  CheckBox,
  Button,
  SmallButton,
  SafeAreaView,
} from "@/components/ui";
import LottieView from "lottie-react-native";
import { showToast } from "@/utils/toast";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import useVisibilityState from "@/hooks/useVisibilityState";

interface StayCancellationSheetProps {
  isOpen: boolean;
  bookingCode: string;
  total_amount: number;
  paid_amount: number;
  onClose: () => void;
  onSubmit: () => void;
  setCancellationError: React.Dispatch<
    React.SetStateAction<BookingCancellationError | null>
  >;
}

const StayCancellationSheet = ({
  isOpen,
  bookingCode,
  total_amount,
  paid_amount,
  onClose,
  onSubmit,
  setCancellationError,
}: StayCancellationSheetProps) => {
  const { formatCurrency } = useCurrency();
  const [isLoading, setLoading] = useState<boolean>(false);
  const [errorResponse, setErrorResponse] = useState<null | string>(null);
  const [creditRefundChecked, toggleCreditRefund] = useToggleState(true);
  const [cancellationReason, setCancellationReason] = useState("");

  const {
    data: cancellationData,
    isLoading: isCancellationLoading,
    error,
  } = useQuery<
    "STAY_BOOKING",
    BookingCancellationResponse,
    BookingCancellationResponse,
    BookingCancellationError
  >(
    "STAY_BOOKING",
    {
      select: (data) => data.data,
      throwOnError: (error) => {
        logAxiosError(error);
        return false;
      },
    },
    {
      path: [bookingCode, "cancellation-details"],
      search: {
        refund_in_credits: String(creditRefundChecked),
      },
    }
  );

  useEffect(() => {
    if (error?.response) {
      if (
        error.response?.status === 403 &&
        typeof error.response?.data?.key === "string"
      ) {
        setCancellationError({
          success: false,
          description: error.response?.data?.description,
          error: error.response?.data?.error,
          key: error.response?.data?.key,
          title: error.response?.data?.title,
        });
        onClose();
      } else {
        setErrorResponse(
          error.response?.status === 403 &&
            typeof error.response?.data?.error === "string"
            ? error.response?.data?.error
            : "Please try again later"
        );
      }
    } else {
      setErrorResponse("");
    }
  }, [error?.response]);

  const [infoRows, mainRows] = useMemo(() => {
    if (!cancellationData) return [[], []];
    const { credits, bank } = cancellationData.refunds.reduce(
      (acc, payment) => {
        if (payment.payment_mode === "Paid via Credits") {
          acc.credits += payment.amount;
        } else if (payment.payment_mode === "PG via Payment Gateway") {
          acc.bank += payment.amount;
        }
        return acc;
      },
      {
        bank: 0,
        credits: 0,
      }
    );

    const mainRows = [
      {
        label: "Total Refund Amount",
        value: formatCurrency(cancellationData.refund_amount),
        highlight: true,
      },
    ];
    if (credits) {
      mainRows.push({
        label: "Refund to Credits",
        value: formatCurrency(credits),
        highlight: false,
      });
    }
    if (bank) {
      mainRows.push({
        label: "Refund to Account",
        value: formatCurrency(bank),
        highlight: false,
      });
    }
    return [
      [
        {
          label: "Total Booking Amount",
          value: formatCurrency(total_amount),
        },
        {
          label: "Amount Paid",
          value: formatCurrency(paid_amount),
        },
        {
          label: "Cancellation Fee",
          value:
            "- " + formatCurrency(paid_amount - cancellationData.refund_amount),
        },
      ],
      mainRows,
    ];
  }, [cancellationData, formatCurrency, paid_amount, total_amount]);

  const { mutateAsync: cancelBooking } = useMutation<
    "STAY_BOOKINGS",
    { reason: string; refund_in_credits: boolean }
  >("STAY_BOOKINGS", undefined, `${bookingCode}/cancel/`);

  const [isConfirmVisible, showCancellationConfirm, hideCancellationConfirm] =
    useVisibilityState(false);

  const onCancel = useCallback(() => {
    hideCancellationConfirm();
    setLoading(true);
    Keyboard.dismiss();
    cancelBooking({
      reason: cancellationReason,
      refund_in_credits: creditRefundChecked,
    })
      .then(() => {
        setTimeout(() => {
          showToast({
            message:
              "Your cancellation request has been received successfully.",
            type: "success",
          });
          setLoading(false);
          onSubmit();
        }, 3000);
      })
      .catch((er) => {
        logAxiosError(er);
        setLoading(false);
        setErrorResponse("Please try again later");
      });
  }, [cancelBooking, cancellationReason, creditRefundChecked, onSubmit]);

  return (
    <Sheet
      isOpen={isOpen}
      onDismiss={onClose}
      snapPoints={["93%"]}
      keyboardBlurBehavior="restore"
    >
      <BottomSheetView style={styles.container}>
        <SectionTitle noHorizontalPadding type="Title">
          Review Cancellation
        </SectionTitle>
        <View style={styles.contentContainer}>
          {isCancellationLoading ? (
            <Animated.View
              style={helpers.flexCenter}
              entering={FadeIn}
              exiting={FadeOut}
            >
              <Loader />
            </Animated.View>
          ) : errorResponse ? (
            <Animated.View
              style={styles.errorContainer}
              entering={FadeIn}
              exiting={FadeOut}
            >
              <LottieView
                source={require("@/assets/lottie/cancellation-error.json")}
                autoPlay
                key="stay-cancellation-error"
                loop
                style={styles.lottieAnimation}
              />
              <View style={styles.errorContent}>
                <Text type="SectionTitle">Something went wrong</Text>
                <Text type="Subtitle">{errorResponse}</Text>
                <SmallButton style={styles.closeButton} onPress={onClose}>
                  Close
                </SmallButton>
              </View>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn} exiting={FadeOut}>
              <View style={styles.infoContainer}>
                {infoRows.map((info) => (
                  <View key={info.label} style={styles.infoRow}>
                    <Text>{info.label}</Text>
                    <Text>{info.value}</Text>
                  </View>
                ))}
                {mainRows.length ? (
                  <Ziew background="Input" style={styles.highlightedRows}>
                    {mainRows.map((info) => (
                      <View key={info.label} style={styles.infoRow}>
                        <Text type="TextHighlight">{info.label}</Text>
                        <Text
                          type={info.highlight ? "TextHighlight" : undefined}
                        >
                          {info.value}
                        </Text>
                      </View>
                    ))}
                  </Ziew>
                ) : null}
              </View>
              <Divider marginTop={16} marginBottom={4} />
              <View style={styles.formContainer}>
                <SectionTitle noHorizontalPadding>
                  Reason for Cancellation
                </SectionTitle>
                <TextInput
                  placeholder="Enter reason for cancellation"
                  value={cancellationReason}
                  onChangeText={setCancellationReason}
                  numberOfLines={1}
                  inSheet
                />
                <Pressable
                  onPress={toggleCreditRefund}
                  disabled={isLoading}
                  style={styles.checkboxContainer}
                >
                  <CheckBox size={16} isSelected={creditRefundChecked} />
                  <Text type="Subtitle">Refund in Credits</Text>
                </Pressable>
                <Button
                  isLoading={isLoading}
                  style={styles.cancel}
                  onPress={showCancellationConfirm}
                >
                  Request Cancellation
                </Button>
              </View>
            </Animated.View>
          )}
        </View>
      </BottomSheetView>
      {isConfirmVisible ? (
        <CancellationConfirmation
          isOpen={isConfirmVisible}
          onDismiss={hideCancellationConfirm}
          onCancel={onCancel}
          onKeep={hideCancellationConfirm}
        />
      ) : null}
    </Sheet>
  );
};

export default StayCancellationSheet;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  errorContainer: {
    alignItems: "center",
    marginTop: 64,
    flex: 1,
  },
  errorContent: {
    gap: 8,
    alignItems: "center",
    marginTop: 16,
  },
  lottieAnimation: {
    width: 100,
    height: 100,
  },
  closeButton: {
    marginTop: 16,
  },
  infoContainer: {
    gap: 8,
    marginVertical: 8,
  },
  highlightedRows: {
    gap: 8,
    marginHorizontal: -12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderCurve: "continuous",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  formContainer: {
    gap: 8,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "flex-start",
    marginVertical: 8,
  },
  cancel: {
    marginTop: 32,
  },
  confirmContainer: {
    paddingHorizontal: 24,
  },
  confirmText: { marginTop: 8, marginBottom: 24 },
  confirmButtons: { gap: 16, marginBottom: 8 },
});

interface CancellationConfirmationProps {
  isOpen: boolean;
  onDismiss: () => void;
  onCancel: () => void;
  onKeep: () => void;
}

const CancellationConfirmation = ({
  isOpen,
  onDismiss,
  onCancel,
  onKeep,
}: CancellationConfirmationProps) => {
  return (
    <Sheet
      isOpen={isOpen}
      onDismiss={onDismiss}
      enableDynamicSizing
      maxDynamicContentSize={500}
    >
      <BottomSheetView>
        <SafeAreaView safeArea="bottom" style={styles.confirmContainer}>
          <SectionTitle noHorizontalPadding type="Title">
            Before you cancel
          </SectionTitle>
          <Text style={styles.confirmText}>
            Once your booking is cancelled, it cannot be reinstated - Customer
            Service or the property can't help undo it as well.
          </Text>
          <View style={styles.confirmButtons}>
            <Button onPress={onCancel}>Cancel Now</Button>
            <Button variant="secondary" onPress={onKeep}>
              I want to keep this booking
            </Button>
          </View>
        </SafeAreaView>
      </BottomSheetView>
    </Sheet>
  );
};
