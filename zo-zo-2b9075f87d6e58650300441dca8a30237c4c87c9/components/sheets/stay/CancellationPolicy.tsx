import { StyleSheet, View } from "react-native";
import React, { useMemo } from "react";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Sheet } from "@/components/sheets";
import { Operator } from "@/definitions/discover";
import { useCurrency } from "@/context/CurrencyContext";
import useQuery from "@/hooks/useQuery";
import moment from "moment";
import { useThemeColors } from "@/context/ThemeContext";
import { StayCancellationInfoResponse } from "@/definitions/booking";
import {
  SafeAreaView,
  SectionTitle,
  Pressable,
  Iconz,
  Text,
  RenderHTMLText,
  Loader,
} from "@/components/ui";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import helpers from "@/utils/styles/helpers";

type CancellationPolicy = {
  start_date: string | null;
  end_date: string | null;
  min_days_before_checkin: number;
  max_days_before_checkin: number | null;
  cancellation_charge: number;
  operator: number;
};

interface CancellationPolicySheetProps {
  isOpen: boolean;
  onDismiss: () => void;
  operator: Operator;
  amount?: number;
  checkinDate?: string;
}

const CancellationPolicySheet = ({
  isOpen,
  onDismiss,
  operator,
  checkinDate,
  amount,
}: CancellationPolicySheetProps) => {
  const { formatCurrency } = useCurrency();

  const closeButton = useMemo(
    () => (
      <Pressable onPress={onDismiss} style={styles.closeButton}>
        <Iconz size={24} name="cross" fillTheme="Primary" />
      </Pressable>
    ),
    [onDismiss]
  );

  const { data: policy } = useQuery<
    "STAY_OPERATORS",
    StayCancellationInfoResponse,
    StayCancellationInfoResponse["cancellation_policy"]
  >(
    "STAY_OPERATORS",
    {
      enabled: !!operator.code,
      select: (data) => data.data.cancellation_policy,
      throwOnError: false,
    },
    {
      path: [operator.code, "cancellation-policy"],
    }
  );

  const policyList = useMemo(
    () =>
      policy
        ?.filter((item) => item.start_date === null && item.end_date === null)
        .sort(
          (p1, p2) => p2.min_days_before_checkin - p1.min_days_before_checkin
        ),
    [policy]
  );

  const colors = useThemeColors(["Text.Progress", "Text.Success", "Vibes.Red"]);

  const policyDetailList = useMemo(() => {
    if (checkinDate && policyList?.length) {
      const curatedPolicy = curatePolicy(
        policyList,
        checkinDate,
        colors,
        operator.checkin_time,
        formatCurrency,
        amount
      );
      return curatedPolicy;
    }
    return [];
  }, [
    policyList,
    checkinDate,
    operator.checkin_time,
    formatCurrency,
    amount,
    colors,
  ]);

  return (
    <Sheet
      isOpen={isOpen}
      onDismiss={onDismiss}
      snapPoints={["100%"]}
      hideHandle
    >
      <SafeAreaView safeArea="top" />
      <SectionTitle content={closeButton}>Cancellation Policy</SectionTitle>
      {policyDetailList.length ? (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          key="content"
          style={styles.container}
        >
          <BottomSheetScrollView
            contentContainerStyle={styles.list}
            style={styles.container}
            showsVerticalScrollIndicator={false}
          >
            <View>
              {policyDetailList.map((item) => (
                <View style={styles.itemContainer} key={item.id}>
                  <View style={styles.rowContainer}>
                    <Text
                      type="Subtitle"
                      children={item.emoji}
                      style={styles.icon}
                    />
                    <Text
                      color={
                        item.isLast && !item.value ? "Primary" : "Secondary"
                      }
                      type="Subtitle"
                      style={styles.titleText}
                    >
                      {item.title}
                    </Text>
                  </View>
                  {item.isLast && !item.value ? null : (
                    <View style={styles.rowContainer}>
                      <View
                        style={[
                          styles.colorBar,
                          { backgroundColor: item.color },
                          item.isLast && { height: 32 },
                        ]}
                      />
                      <View style={styles.valueContainer}>
                        <Text type="SubtitleHighlight" children={item.value} />
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
            {operator.cancellation_policy && (
              <View style={styles.html}>
                <RenderHTMLText
                  color="Secondary"
                  type="Subtitle"
                  html={operator.cancellation_policy}
                />
              </View>
            )}
            <SafeAreaView safeArea="bottom" />
          </BottomSheetScrollView>
        </Animated.View>
      ) : (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          key="loader"
          style={styles.loader}
        >
          <Loader />
        </Animated.View>
      )}
    </Sheet>
  );
};

export default CancellationPolicySheet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 24,
    paddingTop: 12,
  },
  closeButton: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  itemContainer: { gap: 4 },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  titleText: { flex: 1 },
  colorBar: {
    width: 8,
    height: 72,
    borderRadius: 16,
    borderCurve: "continuous",
    marginLeft: 6,
    marginRight: 6,
  },
  valueContainer: {
    flex: 1,
    alignSelf: "flex-start",
  },
  html: { marginTop: 16 },
  icon: { marginLeft: 1, marginTop: 2 },
  loader: {
    flex: 1,
    marginTop: 64,
  },
});

const curatePolicy = (
  policy: CancellationPolicy[],
  checkinDate: string,
  colors: string[],
  checkinTime: string = "12:00:00",
  formatCurrency: (amount: number) => string,
  amount?: number
) => {
  const [yellow, green, red] = colors;
  const diffDays = moment(checkinDate).diff(moment(), "days");
  const remainingPolicy = policy.filter(
    (item) => item.min_days_before_checkin <= diffDays
  );

  const policyViewData = remainingPolicy
    .map((policy, index) => {
      const state =
        policy.max_days_before_checkin == null
          ? "yes"
          : policy.min_days_before_checkin === 0
          ? "no"
          : "mid";

      const color = state === "yes" ? green : state === "no" ? red : yellow;
      const emoji = state === "yes" ? "✅" : state === "no" ? "😢" : "⚠️";
      const separator = "→";
      const prefix =
        index === 0
          ? "Now"
          : moment(checkinDate)
              .subtract(policy.max_days_before_checkin, "days")
              .startOf("day")
              .format("DD MMM hh:mm A");

      const checkinTimeMinusMinute = moment(checkinTime, "hh:mm:ss")
        .subtract(1, "minutes")
        .format("hh:mm A");
      const eod =
        policy.cancellation_charge === 100
          ? checkinTimeMinusMinute
          : "11:59 PM";

      const suffix =
        moment(checkinDate)
          .subtract(policy.min_days_before_checkin, "days")
          .format("DD MMM") +
        " " +
        eod;

      const value =
        policy.cancellation_charge === 0 ? (
          amount ? (
            <Text type="Subtitle">
              <Text type="SubtitleHighlight">{formatCurrency(0)}</Text>{" "}
              Cancellation charge
            </Text>
          ) : (
            <Text type="SubtitleHighlight">Free Cancellation</Text>
          )
        ) : policy.cancellation_charge === 100 ? (
          amount ? (
            <Text type="Subtitle">
              <Text type="SubtitleHighlight">{formatCurrency(amount)}</Text>
              {"\n"}
              Full advance retained
            </Text>
          ) : (
            <Text type="SubtitleHighlight">No Refund</Text>
          )
        ) : amount ? (
          <Text type="Subtitle">
            <Text type="SubtitleHighlight">
              {formatCurrency((amount * policy.cancellation_charge) / 100)}
            </Text>{" "}
            fee
          </Text>
        ) : (
          <Text type="SubtitleHighlight">
            {policy.cancellation_charge}% fee
          </Text>
        );

      return {
        id: index.toString(),
        emoji,
        color,
        title: `${prefix} ${separator} ${suffix}`,
        value,
        isLast: false,
      };
    })
    .concat(
      checkinDate
        ? {
            id: "last",
            color: "transparent",
            emoji: "🏨",
            title: `${moment(checkinDate).format("DD MMM")} ${moment(
              checkinTime,
              "HH:mm:ss"
            ).format("hh:mm A")}`,
            value: <Text type="SubtitleHighlight">Check-in day</Text>,
            isLast: true,
          }
        : {
            id: "last",
            color: "transparent",
            emoji: "🏨",
            title: "Check-in day",
            value: <></>,
            isLast: true,
          }
    );

  return policyViewData;
};
