import { ApiServer, QueryEndpointConfig } from "@/definitions/auth";
import { DiscoverSection } from "@/definitions/explore";
import {
  Destination,
  DiscoverSearchItem,
  DiscoverSeed,
} from "@/definitions/discover";
import { TripSpotlight } from "@/definitions/trip";

const exploreQueryEndpoints = {
  DISCOVER_HOME: {
    server: ApiServer.ZO,
    queryKey: ["discover", "home"],
    url: "/api/v1/discover/home/",
  } as QueryEndpointConfig<DiscoverSection>,

  DISCOVER_SEARCH: {
    server: ApiServer.ZOSTEL,
    queryKey: ["discover", "search", "places"],
    url: "/api/v1/discover/search/places",
  } as QueryEndpointConfig<DiscoverSearchItem>,

  DISCOVER_APP_SEED: {
    server: ApiServer.ZOSTEL,
    queryKey: ["discover", "app", "seed"],
    url: "/api/v1/discover/app/seed",
  } as QueryEndpointConfig<DiscoverSeed>,

  TRIP_SPOTLIGHT: {
    server: ApiServer.ZO,
    url: `/api/v1/discover/spotlight/trips/`,
    queryKey: ["trip", "spotlight"],
  } as QueryEndpointConfig<{ inventories: TripSpotlight[] }>,
  DISCOVER_DESTINATION: {
    server: ApiServer.ZO,
    url: `/api/v1/discover/destination/`,
    queryKey: ["discover", "destination"],
  } as QueryEndpointConfig<Destination>,
  DISCOVER_APP_VERSION: {
    server: ApiServer.ZOSTEL,
    url: `/api/v1/discover/app/version/`,
    queryKey: ["discover", "app", "version"],
  } as QueryEndpointConfig<{
    force_update: boolean;
    soft_update: boolean;
    message: string;
    url: string;
  }>,
};

export { exploreQueryEndpoints };
