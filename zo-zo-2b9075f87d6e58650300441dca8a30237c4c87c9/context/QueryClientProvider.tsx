import { QueryClient, QueryClientProvider as QCP } from "@tanstack/react-query";

const defaultQueryClientOptions = {
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      retryDelay: (attemptIndex: number) =>
        Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus:
        process.env.NODE_ENV === "development" ? false : true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
};

export const queryClient = new QueryClient(defaultQueryClientOptions);

const QueryClientProvider = ({ children }: { children: React.ReactNode }) => {
  return <QCP client={queryClient}>{children}</QCP>;
};

export default QueryClientProvider;
