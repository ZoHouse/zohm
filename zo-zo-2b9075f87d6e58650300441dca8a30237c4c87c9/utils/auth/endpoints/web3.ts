import { ApiServer, QueryEndpointConfig } from "@/definitions/auth";

const web3QueryEndpoints = {
  WEB3_TOKEN_AIRDROPS: {
    server: ApiServer.ZO,
    queryKey: ["web3", "token", "airdrops"],
    url: "/api/v1/webthree/token-airdrops/",
  } as QueryEndpointConfig<{ total_amount: number }>,
};

export { web3QueryEndpoints };
