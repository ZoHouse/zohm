import { logAxiosError } from "@/utils/network";
import useQuery from "./useQuery";
import { SearchResult } from "@/definitions/general";
import {
  TripAvailability,
  TripItinerary,
  TripPricing,
} from "@/definitions/trip";
import { toMapBy } from "@/utils/object";
import { useEffect, useMemo, useState } from "react";
import moment from "moment";

function useTrips(id: string, _selectedSkuId: string = "") {
  const { data: trip, isLoading: isTripLoading } = useQuery(
    "TRIP",
    {
      select: (data) => data.data,
      throwOnError: (er) => {
        logAxiosError(er);
        return false;
      },
    },
    {
      path: [id],
    }
  );

  const { data: itineraries, isLoading: isItinerariesLoading } = useQuery<
    "TRIP",
    SearchResult<TripItinerary>,
    TripItinerary[]
  >(
    "TRIP",
    {
      select: (data) => data.data.results,
      throwOnError: (er) => {
        logAxiosError(er);
        return false;
      },
    },
    {
      path: [id, "itineraries"],
    }
  );

  const { itineraryMap, skuMap, itinerarySkuMap, filteredItineraries } =
    useMemo(() => {
      const itineraryMap = toMapBy(itineraries ?? [], "pid");
      const skuMap = toMapBy(trip?.skus ?? [], "pid");

      const itinerarySkuMap: Record<string, string[]> = {};
      trip?.skus.forEach((sku) => {
        itinerarySkuMap[sku.itinerary] = [
          ...(itinerarySkuMap[sku.itinerary] ?? []),
          sku.pid,
        ];
      });

      const filteredItineraries =
        itineraries?.filter((it) => itinerarySkuMap[it.pid]?.length) ?? [];

      return {
        itineraryMap,
        skuMap,
        itinerarySkuMap,
        filteredItineraries,
      };
    }, [itineraries?.length, trip?.skus.length]);

  const skus = useMemo(
    () => trip?.skus.map((sku) => sku.pid).join(),
    [trip?.skus]
  );

  const { data: seedMonths = 6 } = useQuery("AUTH_APPLICATION_SEED", {
    select: (data) => data?.data?.trip_booking_range ?? 6,
  });

  const [startDate, endDate] = useMemo(
    () => [moment().add(1, "day"), moment().add(seedMonths, "month")],
    [seedMonths]
  );

  const { data: tripData, isLoading: isTripDataLoading } = useQuery(
    "TRIP_PRICING",
    {
      select: (data) => data.data,
      enabled: !!skus,
      throwOnError: (er) => {
        logAxiosError(er);
        return false;
      },
    },
    {
      search: {
        skus: skus!,
        start_date: startDate.format("YYYY-MM-DD"),
        end_date: endDate.format("YYYY-MM-DD"),
      },
    }
  );

  const isLoading = isTripLoading || isTripDataLoading || isItinerariesLoading;

  const [slot, setSlot] = useState<TripAvailability | null>(null);
  const [selectedItineraryId, selectItineraryId] = useState<string>();

  const selectedItinerary =
    itineraryMap && selectedItineraryId
      ? itineraryMap[selectedItineraryId]
      : null;

  useEffect(() => {
    if (_selectedSkuId && skuMap[_selectedSkuId]?.itinerary) {
      selectItineraryId(skuMap[_selectedSkuId].itinerary);
    }
  }, [skuMap]);

  /**
   * `{ sku: { date: { availability } } }`
   */
  const wholeAvailabilityMap = useMemo(() => {
    const result: Record<string, Record<string, TripAvailability>> = {};
    tripData?.availability.forEach((av) => {
      const skuPid = av.pid;
      if (!result[skuPid]) {
        result[skuPid] = {};
      }
      const resultSKU = skuMap[skuPid];
      if (resultSKU.dates.includes(av.date)) {
        result[skuPid][av.date] = av;
      }
    });
    return result;
  }, [trip?.skus.length, tripData?.availability.length]);

  /**
   * `{ sku: { date: { pricing } } }`
   */
  const wholePriceMap = useMemo(() => {
    const result: Record<string, Record<string, TripPricing>> = {};
    tripData?.pricing.forEach((pr) => {
      const skuPid = pr.pid;
      if (!result[skuPid]) {
        result[skuPid] = {};
      }
      const resultSKU = skuMap[skuPid];
      if (resultSKU.dates.includes(pr.date)) {
        result[skuPid][pr.date] = pr;
      }
    });
    return result;
  }, [trip?.skus, tripData?.pricing]);

  const pricing = useMemo(
    () =>
      slot?.pid && slot?.date && wholePriceMap
        ? wholePriceMap[slot.pid][slot.date]
        : undefined,
    [wholePriceMap, slot]
  );

  const duration = selectedItinerary?.duration ?? 1;

  const slots = useMemo(() => {
    if (!selectedItineraryId) return [];
    const skus = itinerarySkuMap[selectedItineraryId];
    return (
      skus?.flatMap((sku) => Object.values(wholeAvailabilityMap[sku] ?? {})) ??
      []
    );
  }, [selectedItineraryId, itinerarySkuMap, wholeAvailabilityMap]);

  const result = useMemo(
    () => ({
      duration,
      pricing,
      wholeAvailabilityMap,
      wholePriceMap,
      slot,
      setSlot,
      isLoading,
      tripData,
      skuMap,
      trip,
      selectedItinerary,
      selectItineraryId,
      itineraries: filteredItineraries,
      itinerarySkuMap,
      slots,
      addons: tripData?.addon_pricing,
    }),
    [
      duration,
      pricing,
      wholeAvailabilityMap,
      wholePriceMap,
      slot,
      setSlot,
      isLoading,
      tripData,
      skuMap,
      trip,
      selectedItinerary,
      filteredItineraries?.length,
      slots,
      tripData?.addon_pricing.length,
    ]
  );
  return result;
}

export default useTrips;
