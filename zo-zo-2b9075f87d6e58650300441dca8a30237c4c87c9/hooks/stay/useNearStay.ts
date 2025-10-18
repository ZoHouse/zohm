import { Destination } from "@/definitions/discover";
import useQuery from "../useQuery";
import { useMemo } from "react";
import { toMapOperatorType } from "@/utils/map";

export function useNearStay(
  destinationCode: string,
  anchorOperatorCode: string
) {
  const { data: destination } = useQuery<
    "STAY_DESTINATIONS",
    { destination: Destination },
    Destination
  >(
    "STAY_DESTINATIONS",
    {
      select: (data) => data.data.destination,
      enabled: !!destinationCode,
      staleTime: 1000 * 60 * 60 * 24 * 3,
    },
    {
      path: [destinationCode],
    }
  );

  const { data: trips } = useQuery(
    "BOOKINGS_TRIP",
    {
      select: (data) => data.data.results,
      enabled: !!destinationCode,
      staleTime: 1000 * 60 * 60 * 24 * 3,
    },
    {
      path: ["inventories", "find"],
      search: {
        destinations: destinationCode,
      },
    }
  );

  const mapOperators = useMemo(
    () =>
      destination
        ? toMapOperatorType(
            destination.operators.filter((o) => o.code !== anchorOperatorCode),
            trips ?? []
          )
        : [],
    [destination?.operators.length, trips?.length, anchorOperatorCode]
  );

  return mapOperators;
}