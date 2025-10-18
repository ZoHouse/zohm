import useQuery from "@/hooks/useQuery";
import { formatCredit } from "@/utils/credit";
import useInifiteQuery from "@/hooks/useInifiteQuery";
import {
  Credit,
  CreditTransaction,
  FormattedCredit,
} from "@/definitions/credits";

const useCredits = (disableListFetch = false) => {
  const { data: credits, refetch: refetchCredits } = useQuery<
    "CREDITS",
    Credit,
    FormattedCredit
  >(
    "CREDITS",
    {
      select: (data) => formatCredit(data.data),
    },
    {
      path: ["me"],
    }
  );

  const { data: transactions, onEndReached } =
    useInifiteQuery<CreditTransaction>({
      key: "CREDITS",
      path: "transactions/",
      enabled: !disableListFetch,
      limit: 10,
    });

  return {
    credits,
    transactions,
    onEndReached,
    refetchCredits,
    hasTransactions: !!transactions?.length,
  };
};

export default useCredits;
