// import Axios from "axios";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ZostelCurrency } from "@/definitions/booking";
import useQuery from "@/hooks/useQuery";

const DEFAULT_CURRENCY: ZostelCurrency = {
  id: "INR",
  value: "INR - Indian Rupee",
  symbol: "₹",
};

interface CurrencyProviderProps {
  children: ReactNode;
}

const getData = async (key: string) => {
  return DEFAULT_CURRENCY;
};


interface CurrencyContext {
  selectedCurrency: ZostelCurrency;
  updateCurrency: (currency: ZostelCurrency) => void;
  allCurrencies: ZostelCurrency[];
  isDefaultCurrency: boolean;
  formatCurrency: (price: number, decimals?: number) => string;
}

const CurrencyContext = createContext<CurrencyContext>({
  selectedCurrency: DEFAULT_CURRENCY,
  updateCurrency: () => {},
  allCurrencies: [],
  isDefaultCurrency: true,
  formatCurrency: () => "",
});

const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] =
    useState<ZostelCurrency>(DEFAULT_CURRENCY);

  const { data: allCurrencies } = useQuery("PAYMENT_EXCHANGE_CURRENCIES", {
    enabled: true,
    select: (data) =>
      data.data.currencies.map((k: any) => {
        return {
          id: k.code,
          value: `${k.code} - ${k.description}`,
          symbol: k.symbol || "",
        } as ZostelCurrency;
      }),
  });

  const {
    data: currencyConversion,
    isLoading: isLoadingConversion,
    isFetching: isFetchingConversion,
    refetch,
  } = useQuery(
    "PAYMENT_EXCHANGE_RATE",
    {
      enabled: false,
      select: (data) => Number(data.data.rate),
    },
    {
      search: {
        from: "INR",
        to: selectedCurrency.id,
      },
    }
  );

  const isDefaultCurrency = useMemo(
    () => selectedCurrency.id === DEFAULT_CURRENCY.id,
    [selectedCurrency.id]
  );

  useEffect(() => {
    (async () => {
      const storedCurrency = await getData("selectedCurrency");
      if (storedCurrency) {
        setSelectedCurrency(storedCurrency);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isDefaultCurrency) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCurrency]);

  const formatCurrency = (price: number, decimals: number = 2) => {
    return isLoadingConversion || isFetchingConversion
      ? "..."
      : `${selectedCurrency.symbol}${
          // String(
          //   Number(
          //     Number(
          //       !isDefaultCurrency ? Number(currencyConversion) * price : price
          //     ).toFixed(2)
          //   )
          // )
          Number(
            (!isDefaultCurrency
              ? Number(currencyConversion) * price
              : price
            ).toFixed(decimals)
          ).toLocaleString()
        }${selectedCurrency.symbol === "" ? ` ${selectedCurrency.id}` : ""}`;
  };

  const updateCurrency = useCallback((currency: ZostelCurrency) => {
    setSelectedCurrency(currency);
  }, []);

  const values = useMemo(() => {
    return {
      selectedCurrency,
      updateCurrency,
      allCurrencies: allCurrencies || [],
      isDefaultCurrency,
      formatCurrency,
    };
  }, [selectedCurrency, allCurrencies, isDefaultCurrency, formatCurrency]);

  return <CurrencyContext.Provider value={values} children={children} />;
};

export default CurrencyProvider;

export const useCurrency = () => {
  return useContext(CurrencyContext);
};
