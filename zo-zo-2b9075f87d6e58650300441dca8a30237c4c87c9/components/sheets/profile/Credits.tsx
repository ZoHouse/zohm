import { StyleSheet, View } from "react-native";
import { BottomSheetFlashList, BottomSheetView } from "@gorhom/bottom-sheet";
import Sheet from "@/components/sheets/Base";
import { Loader, SafeAreaView, SectionTitle, Text } from "@/components/ui";
import useCredits from "@/hooks/useCredit";
import { memo, useCallback, useMemo } from "react";
import { CreditTransaction } from "@/definitions/credits";
import moment from "moment";
import { formatTransaction } from "@/utils/credit";
import helpers from "@/utils/styles/helpers";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

interface CreditsSheet {
  isOpen: boolean;
  onClose: () => void;
}

const CreditsSheet = ({ isOpen, onClose }: CreditsSheet) => {
  const { credits, transactions, onEndReached } = useCredits();

  const creditValue = useMemo(
    () => <Text type="TextHighlight">{credits?.value}</Text>,
    [credits?.value]
  );

  const formattedTransactions = useMemo(
    () => transactions?.map((txn) => formatTransaction(txn)),
    [transactions]
  );

  const renderItem = useCallback(
    ({ item }: { item: ReturnType<typeof formatTransaction> }) => (
      <View style={styles.row}>
        <View style={styles.rowContent}>
          {item.description ? (
            <>
              <Text>{item.description}</Text>
              <Text type="Tertiary" color="Secondary">
                {moment(item.created_at).format("DD MMM YYYY")}
              </Text>
            </>
          ) : item.created_at ? (
            <Text>{moment(item.created_at).format("DD MMM YYYY")}</Text>
          ) : (
            <></>
          )}
        </View>
        {item.action === "spend" ? (
          <Text color="Error" type="TextHighlight">
            - {item.value}
          </Text>
        ) : (
          <Text color="Success" type="TextHighlight">
            + {item.value}
          </Text>
        )}
      </View>
    ),
    []
  );

  return (
    <Sheet isOpen={isOpen} onDismiss={onClose} snapPoints={["75%"]}>
      <SectionTitle type="Title" content={creditValue}>
        Credits
      </SectionTitle>
      {formattedTransactions?.length ? (
        <Animated.View key="list" entering={FadeIn} exiting={FadeOut} style={styles.flex}>
          <BottomSheetFlashList
            style={styles.flex}
            data={formattedTransactions}
            renderItem={renderItem}
            estimatedItemSize={56}
            contentContainerStyle={styles.contentContainer}
            ListFooterComponent={<SafeAreaView safeArea="bottom" />}
            onEndReached={onEndReached}
          />
        </Animated.View>
      ) : (
        <Animated.View
          key="loader"
          entering={FadeIn}
          exiting={FadeOut}
          style={styles.loaderContainer}
        >
          <Loader />
        </Animated.View>
      )}
    </Sheet>
  );
};

export default memo(CreditsSheet);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    ...helpers.stretch,
    paddingTop: 8,
  },
  loaderContainer: {
    ...helpers.stretch,
    paddingTop: 48,
  },
  contentContainer: {
    paddingHorizontal: 24,
    gap: 16,
    paddingVertical: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    minHeight: 56,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingRight: 24,
  },
  rowContent: {
    flex: 1,
    gap: 4,
  },
});
