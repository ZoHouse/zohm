import { Href, router } from "expo-router";
import { axiosInstances } from "./auth/client";
import { Linking } from "react-native";
import { logAxiosError } from "./network";

export const getLinkingMeta = (url: string) => {
  return axiosInstances.ZOSTEL.get(`/api/v1/stay/metadata/?url=${encodeURIComponent(url)}`)
    .then((res) => res.data)
    .then((data) => {
      let linkData = {
        type: "webview",
        code: url,
        queryParams: undefined
      } as {
        type: "webview" | "property" | "destination" | "trip" | "blog" | "checkin" | "booking";
        code: string;
        queryParams?: Record<string, string>;
      };
      if (data.type === "operator") {
        linkData = {
          type: "property",
          code: data.data.code ?? data.data.query_params?.property_code,
          queryParams: data.data.query_params
        };
      } else if (data.type === "destination") {
        linkData = {
          type: "destination",
          code: data.data.code,
        };
      } else if (data.type === "blog") {
        linkData = {
          type: "blog",
          code: data.data.blogs.url_slug,
        };
      } else if (data.data?.title === "Blog Feed | Zostel") {
        linkData = {
          type: "blog",
          code: "all",
        };
      } else if (data.type === "trip") {
        linkData = {
          type: "trip",
          code: data.data?.data?.slug ?? data.data?.data?.query_params?.pid,
          queryParams: data.data?.data?.query_params
        };
      } else if (data.type === "destinations") {
        linkData = {
          type: "destination",
          code: "all"
        }
      } else if (data.type === "checkin") {
        const booking_code = data.data?.booking_code;
        const queryParams = booking_code ? { booking_code } : undefined;
        linkData = {
          type: "checkin",
          code: data.data?.code,
          queryParams
        };
      } else if (data.type === "booking") {
        const booking_code = data.data?.code;
        linkData = {
          type: "booking",
          code: booking_code,
        }
      } else if (data.type === "default") {
        return "/(tabs)/explore"
      }
      return linkData;
    })
    .catch((e) => {
      logAxiosError(e);
      return "/(tabs)/explore" as const;
    });
};

export const handleDeepLink = (deeplink?: string, link?: string) => {
  if (!deeplink || deeplink === "zostel://meta/") {
    if (link) {
      getLinkingMeta(link).then((data) => {
        if (typeof data === "string") {
          // Todo: handle edge case
          return;
        }
        const { type, code } = data;
        if (type === "property") {
          router.push(`/property/${code}`);
        } else if (type === "destination") {
          router.push(`/destination/${code}`);
        } else if (type === "trip") {
          router.push(`/trip/${code}`);
        } else if (type === "webview") {
          Linking.openURL(code);
        }
      });
    }
  } else {
    Linking.openURL(deeplink);
  }
};

export const webLinkToHref = (url: string) =>
  getLinkingMeta(url).then((data) => {
    if (typeof data === "string") {
      return { type: "href", path: data } as const;
    }
    const { type, code, queryParams } = data;
    if (type === "webview") {
      return { type: "webview", path: url } as const;
    } else {
      const qp = queryParams ? `?${new URLSearchParams(queryParams).toString()}` : "";
      const path: Href = `/${type}/${code}${qp}`;
      return { type: "href", path } as const;
    }
  });
