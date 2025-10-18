import { ApiServer, QueryEndpointConfig } from "@/definitions/auth";
import { SearchResult } from "@/definitions/general";
import { ChatMessageUser, Thread } from "@/definitions/thread";

const commsQueryEndpoints = {
  COMMS_THREADS: {
    server: ApiServer.ZO_COMMS,
    queryKey: ["comms", "threads"],
    url: `/api/v1/comms/threads/`,
  } as QueryEndpointConfig<SearchResult<Thread>>,
  COMMS_SILENCED_ACCOUNTS: {
    server: ApiServer.ZO_COMMS,
    queryKey: ["comms", "silenced-accounts"],
    url: `/api/v1/comms/silenced-accounts/`,
  } as QueryEndpointConfig<SearchResult<ChatMessageUser>>,
  COMMS_ME: {
    server: ApiServer.ZO_COMMS,
    queryKey: ["comms", "accounts", "me"],
    url: `/api/v1/comms/accounts/me/`,
  } as QueryEndpointConfig<ChatMessageUser>,
};

export type CommsQueryEndpoints = typeof commsQueryEndpoints;
export { commsQueryEndpoints };
