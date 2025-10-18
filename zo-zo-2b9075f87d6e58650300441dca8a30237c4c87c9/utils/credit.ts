import { Credit, CreditTransaction } from "@/definitions/credits";

export const formatBalance = (balance: number) => {
  return balance.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
};

export const formatCredit = (credit: Credit) => {
  const shortBalance = credit.balance / 10 ** credit.currency.decimals;
  const balance = formatBalance(Number(shortBalance.toFixed(2)));
  return {
    shortBalance,
    balance: credit.balance,
    currency: credit.currency,
    value: `${credit.currency.symbol}${balance}`,
  };
};

export const formatTransaction = (txn: CreditTransaction) => {
  const balance = formatBalance(
    Number((txn.amount / 10 ** txn.currency.decimals).toFixed(2))
  );
  return {
    ...txn,
    value: `${txn.currency.symbol}${balance}`,
  };
};
