import { GeneralObject } from "@/definitions/general";
import { allQueryEndpoints, AllQueryEndpointKeys } from "@/hooks/useQuery";
import { axiosInstances } from "@/utils/auth/client";
import { logAxiosError } from "@/utils/network";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback } from "react";

export default function useInifiteQuery<T extends object = GeneralObject>({
  key,
  path = "",
  enabled = true,
  limit = 10,
  query = "",
  disableLogError = false,
}: {
  key: AllQueryEndpointKeys;
  path?: string;
  query?: string;
  enabled?: boolean;
  limit?: number;
  disableLogError?: boolean;
}) {
  const { server, url, queryKey } = allQueryEndpoints[key];
  const absoluteURL = url.concat(path);
  const axios = axiosInstances[server];

  const {
    data: _data,
    fetchNextPage,
    hasNextPage,
    ...rest
  } = useInfiniteQuery({
    queryKey: [...queryKey, path, query],
    queryFn: ({ pageParam = 0 }) => {
      return axios
        .get(
          `${absoluteURL}?limit=${limit}&offset=${pageParam}${
            query ? `&${query}` : ""
          }`
        )
        .then((res) => ({ ...res.data, pageParam }));
    },
    getNextPageParam: (lastPage) => {
      const nextParam = lastPage.next ? lastPage.pageParam + limit : undefined;
      return nextParam;
    },
    enabled,
    initialPageParam: 0,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      items: data.pages.flatMap((page) => page.results || []),
    }),
    throwOnError: (er) => {
      if (disableLogError) {
        return false;
      }
      logAxiosError(er);
      return false;
    },
  });

  const onEndReached = useCallback(() => {
    if (hasNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage]);

  const data = _data?.items as T[] | undefined;

  return {
    ...rest,
    data,
    onEndReached,
    hasNextPage,
  };
}
