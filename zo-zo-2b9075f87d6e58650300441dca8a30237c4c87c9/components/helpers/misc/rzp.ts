import RazorpayCheckout, {
  CheckoutOptions,
  ErrorResponse,
  SuccessResponse,
} from "react-native-razorpay";
import Logger from "@/utils/logger";

export const openRazorpay = (
  options: CheckoutOptions,
  successCallback?: (data: SuccessResponse) => void,
  errorCallback?: (data: ErrorResponse) => void,
  category: "zo" | "zostel" = "zostel"
) =>
  RazorpayCheckout.open(options, successCallback, errorCallback).then((res) => {
    Logger.purchase(
      options.amount / (category === "zo" ? Math.pow(10, 8) : 1),
      options.currency
    );
    return res;
  });