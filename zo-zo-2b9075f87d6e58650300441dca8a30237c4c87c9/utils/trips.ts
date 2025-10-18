import { ZoCurrency } from "@/definitions/booking";
import {
  TripAddonPricing,
  TripCancellationPolicy,
  TripInventory,
  TripItinerary,
  TripPricing,
  TripTax,
} from "@/definitions/trip";
import useInifiteQuery from "@/hooks/useInifiteQuery";
import { useReactiveRef } from "./hooks";
import { useCallback } from "react";

export const withCurrency = (price: number, currency: ZoCurrency) => {
  if (isNaN(price)) {
    return `${currency?.symbol || currency?.code} 0`;
  } else {
    return `${currency?.symbol || currency?.code}${Number(
      price.toFixed(2)
    ).toLocaleString()}`;
  }
};

export const getCurrenciedPrice = (
  price: number,
  currency: ZoCurrency,
  units: number | undefined = 1,
  decimals: number | undefined = 2
) => {
  if (isNaN(price)) {
    return `${currency?.symbol || currency?.code} 0`;
  } else {
    const priceWithDecimal = price / Math.pow(10, currency?.decimals);
    return `${currency?.symbol || currency?.code}${Number(
      (units * priceWithDecimal).toFixed(decimals)
    ).toLocaleString()}`;
  }
};

const toValidAddonPrice = (
  priceObject?: TripAddonPricing
): TripAddonPricing | undefined => {
  if (!priceObject) return undefined;
  const denominator = Math.pow(10, priceObject.prices[0].currency.decimals);
  return {
    ...priceObject,
    prices: priceObject.prices.map((price) => ({
      ...price,
      price: price.price / denominator,
      price_taxed: price.price_taxed / denominator,
    })),
  };
};

export const validateTax = (taxObject?: TripTax): TripTax | undefined => {
  if (!taxObject) return undefined;
  const denominator = Math.pow(10, taxObject.currency.decimals);
  const result = {
    ...taxObject,
    country_tax: taxObject.country_tax / denominator,
    state_tax: taxObject.state_tax / denominator,
    tax_amount: taxObject.tax_amount / denominator,
  };
  if (taxObject.tcs) {
    result.tcs = taxObject.tcs / denominator;
  }
  if (taxObject.tcs_base) {
    result.tcs_base = taxObject.tcs_base / denominator;
  }
  return result;
};

export const validatePrice = (
  pricing?: TripPricing
): TripPricing | undefined => {
  if (!pricing) return undefined;
  const denominator = Math.pow(10, pricing.currency.decimals);
  return {
    ...pricing,
    tax: validateTax(pricing.tax),
    price: pricing.price / denominator,
    strike_price: pricing.strike_price / denominator,
    price_taxed: pricing.price_taxed / denominator,
    strike_price_taxed: pricing.strike_price_taxed / denominator,
    labels: pricing.labels?.map(
      (label: { name: string; discount: number }) => ({
        ...label,
        discount: label.discount / denominator,
      })
    ),
  };
};

const toInventoryPrice = (priceObject?: TripPricing, units: number = 1) => {
  if (!priceObject) return null;
  const price = priceObject;
  const final = price.price;
  const original = price.strike_price;
  const discount =
    (price.labels.reduce((ac, el) => ac + el.discount, 0) / original) * 100;
  return {
    discount: discount ? `${discount.toFixed(0)}% off` : undefined,
    final: getCurrenciedPrice(final, price.currency, units),
    original:
      original === final
        ? undefined
        : getCurrenciedPrice(original, price.currency, units),
  };
};

export const makeTripsCancellationPolicyList = (
  policy: TripCancellationPolicy[]
) => {
  const sortedFilteredPolicy = policy
    .filter((p) => p.start_at === null && p.end_at === null)
    .sort((p1, p2) => p1.cancellation_charge - p2.cancellation_charge);

  let value = sortedFilteredPolicy
    .map((p) => [
      p.cancellation_charge === 0
        ? `${hoursToDays(p.min_hours_till_start)}+ days`
        : p.cancellation_charge === 100
        ? `Within ${hoursToDays(p.max_hours_till_start ?? 0)} day${
            (p.max_hours_till_start ?? 0) > 24 ? "s" : ""
          }`
        : `${hoursToDays(p.min_hours_till_start)} - ${hoursToDays(
            p.max_hours_till_start ?? 0
          )} days`,
      p.cancellation_charge === 0
        ? "Free cancellation, full refund"
        : p.cancellation_charge === 100
        ? "No refund, full advance retained"
        : `${p.cancellation_charge}% fee (on total booking amount)`,
    ])
    .map(([prefix, suffix], index, list) => ({
      id: index.toString(),
      label: `${prefix}: ${suffix}`,
      emoji: index === 0 ? "✅" : index === list.length - 1 ? "🙅" : "✂️",
    }));

  const maxDays = hoursToDays(
    sortedFilteredPolicy[0]?.min_hours_till_start ?? 0
  );

  const result = [{ value }];

  if (maxDays > 0) {
    result.push({
      // @ts-ignore
      value: `No modification allowed within ${maxDays} day non cancellation period`,
    });
  }

  return result;
};

const hoursToDays = (hours: number) => {
  const days = Math.floor(hours / 24);
  return days;
};

export const useFetchTrips = (config?: {
  limit?: number;
  query?: string;
  path?: string;
}) => {
  const {
    data: trips,
    onEndReached,
    hasNextPage,
    ...rest
  } = useInifiteQuery<TripInventory>({
    key: "TRIP",
    limit: config?.limit ?? 4,
    query: config?.query ?? "",
    path: config?.path ?? "",
    enabled: true,
  });

  const onEndReachedRef = useReactiveRef(onEndReached);

  const _onEndReached = useCallback(() => {
    onEndReachedRef.current?.();
  }, []);

  return { trips, onEndReached: _onEndReached, hasNextPage, ...rest };
};

export const mediaFromItinerary = (itinerary: TripItinerary) => {
  if (itinerary.media.length) {
    return itinerary.media;
  }
  return itinerary.stops.flatMap((stop) => stop.media);
}