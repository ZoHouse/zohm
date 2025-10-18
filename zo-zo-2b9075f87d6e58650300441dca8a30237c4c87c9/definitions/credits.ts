import { ZoCurrency } from "@/definitions/booking";

export interface CreditTransaction {
  created_at: string;
  updated_at: string;
  amount: number;
  currency: {
    name: string;
    code: string;
    decimals: number;
    symbol: string;
  };
  action: "deposit" | "spend";
  purpose: string;
  description: string;
  receipt: {
    booking: string;
  };
}

export interface Credit {
  balance: number;
  currency: ZoCurrency;
}

export interface FormattedCredit {
  shortBalance: number;
  balance: number;
  currency: ZoCurrency;
  value: string;
}
