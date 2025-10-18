import constants from "@/utils/constants";
import { Operator } from "./discover";
import { ZoCurrency } from "./booking";

export enum ProfileClaimStatus {
  PENDING = "pending",
  INITIATED = "initiated",
  SUCCESS = "success",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export interface ProfileClaim {
  status: ProfileClaimStatus;
  grant: {
    id: string;
    name: string;
  };
  wallet_address: string;
  field: string;
  description: string;
  amount: number;
  claimed_at: string;
}

export interface ZoCountry {
  name: string;
  code: string; // 3 digit
  local_currency: string;
  flag: string;
  mobile_code: string;
}

export interface ZoPaymentProcessResponse {
  success: boolean;
  order_id: string;
  order_status: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  merchant: string;
  key: string;
}


/**
 * Returns a different response for stay payments, although api is same, Don't rely on this. :)
 */
export interface ZoPostPaymentResponse {
  amount: number;
  success: true;
  order_id: string;
  order_status: string;
  currency: string;
  name: string;
  description?: string;
  merchant: string;
  key: string;
}

export interface MapOperator {
  name: string;
  image: string;
  latitude: number;
  longitude: number;
  code: string;
  type_code: Operator["type_code"] | "T";
  operating_model: Operator["operating_model"] | "T";
  type: keyof typeof constants.map.urls;
  batches?: string[];
  price?: number;
  currency?: ZoCurrency;
}
