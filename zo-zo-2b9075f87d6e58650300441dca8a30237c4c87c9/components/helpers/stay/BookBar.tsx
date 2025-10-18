import React, { memo, useCallback, useMemo, useRef } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  SlideInRight,
  SlideOutRight,
} from "react-native-reanimated";
import Button from "@/components/ui/Button";
import Loader from "@/components/ui/Loader";
import SafeAreaView from "@/components/ui/SafeAreaView";
import Pressable from "@/components/ui/Pressable";
import Text from "@/components/ui/Text";
import { useBooking } from "@/context/BookingContext";
import { useCurrency } from "@/context/CurrencyContext";
import { Operator } from "@/definitions/discover";
import { CouponResponse } from "@/definitions/booking";
import useVisibilityState from "@/hooks/useVisibilityState";
import SummarySheet from "@/components/sheets/stay/Summary";
import TagsSheet from "@/components/sheets/stay/Tags";
import DatePickerSheet from "@/components/sheets/DatePicker";
import Ziew from "@/components/ui/View";

interface BookBarProps {
  operator: Operator;
  scrollToRooms: () => void;
  minPrice: number;
  couponResponse?: CouponResponse;
  isLoadingApplyCoupon: boolean;
  isLoadingPricing: boolean;
  onNext: () => void;
}

const BookBar = memo(
  ({
    operator,
    scrollToRooms,
    minPrice,
    couponResponse,
    isLoadingApplyCoupon,
    isLoadingPricing,
    onNext,
  }: BookBarProps) => {
    const { startDate, endDate, duration, setEndDate } = useBooking();
    const { formatCurrency } = useCurrency();
    const [isSummaryOpen, showSummary, hideSumary] = useVisibilityState(false);
    const [isKnowBeforeYouGoOpen, showKnowBeforeYouGo, hideKnowBeforeYouGo] =
      useVisibilityState(false);
    const [isDatePickerOpen, showDatePicker, hideDatePicker] =
      useVisibilityState(false);
    const hasShowKnowBeforeYouGo = useRef(false);

    const dateString = useMemo(
      () => `${startDate.format("DD MMM")} - ${endDate.format("DD MMM")}`,
      [startDate, endDate]
    );

    const navigateToNext = useCallback(() => {
      hideSumary();
      hideKnowBeforeYouGo();
      onNext();
    }, [onNext]);

    const tags = useMemo(
      () =>
        operator.tags.filter((tag) => tag.categories?.includes("booking_flow")),
      [operator.tags]
    );

    const onBook = useCallback(() => {
      if (!hasShowKnowBeforeYouGo.current && tags.length) {
        showKnowBeforeYouGo();
        hasShowKnowBeforeYouGo.current = true;
        return;
      } else {
        hideSumary();
        navigateToNext();
      }
    }, [showKnowBeforeYouGo, hideKnowBeforeYouGo, navigateToNext, tags]);

    return (
      <Animated.View entering={FadeInDown.delay(100)}>
        <Ziew background style={styles.bookbar}>
          <SafeAreaView safeArea="bottom" style={styles.safeArea}>
            <Animated.View style={styles.container}>
              <View style={styles.contentContainer}>
                <Pressable activeOpacity={0.8} onPress={showDatePicker}>
                  <Text type="Subtitle" style={styles.dateText}>
                    {dateString}
                  </Text>
                </Pressable>
                {isLoadingPricing || isLoadingApplyCoupon ? (
                  <Animated.View
                    key="loader"
                    entering={FadeIn}
                    exiting={FadeOut}
                  >
                    <Loader height={42} width={42} />
                  </Animated.View>
                ) : couponResponse ? (
                  <Animated.View
                    key="coupon-response"
                    entering={FadeIn}
                    exiting={FadeOut}
                  >
                    <Text>
                      Payable now{" "}
                      {formatCurrency(couponResponse.advance_amount)}
                    </Text>
                    <Text type="Tertiary" color="Secondary">
                      Total: {formatCurrency(couponResponse.total_amount)} •{" "}
                      {duration} Night
                      {duration > 1 ? "s" : ""}
                    </Text>
                  </Animated.View>
                ) : minPrice ? (
                  <Animated.View
                    key="min-price"
                    entering={FadeIn}
                    exiting={FadeOut}
                  >
                    <>
                      <Text>
                        Starting from
                        <Text type="TextHighlight">
                          {" "}
                          {formatCurrency(minPrice, 0)}
                        </Text>
                      </Text>
                      <Text type="Tertiary" color="Secondary">
                        {duration} Night
                        {duration > 1 ? "s" : ""}
                      </Text>
                    </>
                  </Animated.View>
                ) : (
                  <Text type="TextHighlight">...</Text>
                )}
              </View>
              <Animated.View>
                {couponResponse ? (
                  <Animated.View
                    key="summary"
                    entering={SlideInRight.springify().dampingRatio(0.8)}
                    exiting={SlideOutRight}
                  >
                    <Button onPress={showSummary} style={styles.button}>
                      Summary
                    </Button>
                  </Animated.View>
                ) : (
                  <Animated.View
                    key="select-rooms"
                    entering={SlideInRight.springify().dampingRatio(0.8)}
                    exiting={SlideOutRight}
                  >
                    <Button onPress={scrollToRooms} style={styles.button}>
                      Select Rooms
                    </Button>
                  </Animated.View>
                )}
              </Animated.View>
            </Animated.View>
            {isSummaryOpen && couponResponse && (
              <SummarySheet
                isOpen={isSummaryOpen}
                couponResponse={couponResponse}
                onClose={hideSumary}
                onBook={onBook}
                formatCurrency={formatCurrency}
              />
            )}
            {isKnowBeforeYouGoOpen && (
              <TagsSheet
                isOpen={isKnowBeforeYouGoOpen}
                onClose={hideKnowBeforeYouGo}
                tags={tags}
                onBook={navigateToNext}
              />
            )}
            {isDatePickerOpen && (
              <DatePickerSheet
                isOpen={isDatePickerOpen}
                onClose={hideDatePicker}
                onSave={() => {}}
              />
            )}
          </SafeAreaView>
        </Ziew>
      </Animated.View>
    );
  }
);

const styles = StyleSheet.create({
  bookbar: {
    width: "100%",
  },
  safeArea: {
    paddingHorizontal: 24,
    width: "100%",
    paddingTop: 8,
    minHeight: 116,
    shadowColor: "gray",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  container: {
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    flex: 1,
    alignSelf: "stretch",
  },
  contentContainer: {
    flex: 1,
    alignSelf: "stretch",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 2,
  },
  dateText: {
    textDecorationLine: "underline",
  },
  button: {
    paddingHorizontal: 16,
  },
});

export default BookBar;
