import { ApiServer, QueryEndpointConfig } from "@/definitions/auth";
import { SearchResult } from "@/definitions/general";
import { ZoCountry } from "@/definitions/zo";

const zoQueryEndpoints = {
  ZO_COUNTRIES: {
    server: ApiServer.ZO,
    queryKey: ["zo", "countries"],
    url: `/api/v1/zoworld/countries/`,
  } as QueryEndpointConfig<SearchResult<ZoCountry>>,
  BLOG: {
    server: ApiServer.ZOSTEL,
    queryKey: ["zo", "blog"],
    url: `/api/v1/blog/`,
  } as QueryEndpointConfig<{}>,
};

export type ZoQueryEndpoints = typeof zoQueryEndpoints;
export { zoQueryEndpoints };
