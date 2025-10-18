import { Button, GradientFooter, Text } from "@/components/ui";
import { StayBooking } from "@/definitions/booking";
import useMutation from "@/hooks/useMutation";
import { memo, useCallback, useState } from "react";
import { StyleSheet } from "react-native";
import { openRazorpay } from "../misc/rzp";
import { logAxiosError } from "@/utils/network";
import { showToast } from "@/utils/toast";

interface PendingPaymentProps {
  payment: StayBooking["payments"][number];
  refetch: () => void;
  formatCurrency: (amount: number) => string;
}

// TODO: Add credits
const PendingPayment = ({
  payment,
  refetch,
  formatCurrency,
}: PendingPaymentProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const { mutateAsync: processOrder } = useMutation(
    "ZOSTEL_PAYMENT_PROCESS_ORDER"
  );
  const { mutateAsync: postPaymentResponse } = useMutation(
    "ZOSTEL_PAYMENT_RESPONSE"
  );
  const { mutateAsync: postBookingPayments } = useMutation("BOOKINGS_PAYMENTS");


  const onPay = useCallback(() => {
    setIsLoading(true);
    processOrder(payment)
      .then((res) => res.data)
      .then((paymentResponse) => openRazorpay(paymentResponse))
      .then((result) => postPaymentResponse(result))
      .then((res) => res.data)
      .then((postBooking) => postBookingPayments(postBooking))
      .then(() => refetch())
      .catch((er) => {
        logAxiosError(er);
        showToast({
          message: "Error processing payment. Please try later.",
          type: "error",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <GradientFooter style={styles.pendingPaymentContainer}>
      <>
        <Text center type="Tertiary" color="Secondary">
          Pay advance amount to confirm stay within 24 hours
        </Text>
        <Button isLoading={isLoading} onPress={onPay}>
          Pay {formatCurrency(payment.amount)}
        </Button>
      </>
    </GradientFooter>
  );
};

export default memo(PendingPayment);

const styles = StyleSheet.create({
  pendingPaymentContainer: {
    position: "absolute",
    bottom: 0,
    gap: 4,
  },
});
