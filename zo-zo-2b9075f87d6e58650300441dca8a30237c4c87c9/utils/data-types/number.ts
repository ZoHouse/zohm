/**
 * Formats a balance number into a short string.
 *
 * @param balance - The balance number to format.
 * @returns A short string representation of the balance.
 */
export const formatBalanceShort = (balance: number) => {
  if (balance < 1e4)
    return balance.toLocaleString("en-US", {
      maximumFractionDigits: 2,
    });
  if (balance > 1e12) {
    return `${Number((balance / 1e12).toFixed(2)).toLocaleString("en-US", {
      maximumFractionDigits: 2,
    })} T`;
  } else if (balance > 1e9) {
    return `${Number((balance / 1e9).toFixed(2)).toLocaleString("en-US", {
      maximumFractionDigits: 2,
    })} B`;
  } else if (balance > 1e6) {
    return `${Number((balance / 1e6).toFixed(2)).toLocaleString("en-US", {
      maximumFractionDigits: 2,
    })} M`;
  } else if (balance > 1e3) {
    return `${Number((balance / 1e3).toFixed(2)).toLocaleString("en-US", {
      maximumFractionDigits: 2,
    })} K`;
  }
  return balance.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
};

export const formatWalletAddress = (address: string) => {
  return address.slice(0, 4) + "..." + address.slice(-4);
};
