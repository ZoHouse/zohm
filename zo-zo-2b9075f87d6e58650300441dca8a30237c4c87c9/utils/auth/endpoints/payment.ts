import {
  ApiServer,
  HttpMethod,
  MutationEndpointConfig,
  QueryEndpointConfig,
} from "@/definitions/auth";
import {
  StayBooking,
  ZostelCurrency,
  ZostelExchangeRate,
} from "@/definitions/booking";
import { TripBooking } from "@/definitions/trip";
import {
  ZoPaymentProcessResponse,
  ZoPostPaymentResponse,
} from "@/definitions/zo";
import { SuccessResponse } from "react-native-razorpay";

const paymentQueryEndpoints = {
  PAYMENT_EXCHANGE_CURRENCIES: {
    server: ApiServer.ZOSTEL,
    queryKey: ["payment", "exchange", "currencies"],
    url: `/api/v2/payment/exchange/currencies/`,
  } as QueryEndpointConfig<{ currencies: ZostelCurrency[] }>,

  PAYMENT_EXCHANGE_RATE: {
    server: ApiServer.ZOSTEL,
    queryKey: ["payment", "exchange", "rate"],
    url: `/api/v2/payment/exchange/rate/`,
  } as QueryEndpointConfig<ZostelExchangeRate>,
};

const paymentMutationEndpoints = {
  PAYMENT_PROCESS_ORDER: {
    server: ApiServer.ZO,
    url: `/api/v1/rzp-payment/process-order/`,
    method: HttpMethod.POST,
  } as MutationEndpointConfig<
    ZoPaymentProcessResponse,
    TripBooking["payments"][number]
  >,
  PAYMENT_RESPONSE: {
    server: ApiServer.ZO,
    url: "/api/v1/rzp-payment/payment-response/",
    method: HttpMethod.POST,
  } as MutationEndpointConfig<ZoPostPaymentResponse, SuccessResponse>,
  BOOKINGS_PAYMENTS: {
    server: ApiServer.ZOSTEL,
    url: "/api/v1/stay/bookings/payments/",
    method: HttpMethod.POST,
  } as MutationEndpointConfig<any, any>,
  ZOSTEL_PAYMENT_PROCESS_ORDER: {
    server: ApiServer.ZOSTEL,
    url: `/api/v2/payment/process-order/`,
    method: HttpMethod.POST,
  } as MutationEndpointConfig<any, StayBooking["payments"][number]>,
  ZOSTEL_PAYMENT_RESPONSE: {
    server: ApiServer.ZOSTEL,
    url: "/api/v2/payment/payment-response/",
    method: HttpMethod.POST,
  } as MutationEndpointConfig<ZoPostPaymentResponse, SuccessResponse>,
};

export { paymentQueryEndpoints, paymentMutationEndpoints };
