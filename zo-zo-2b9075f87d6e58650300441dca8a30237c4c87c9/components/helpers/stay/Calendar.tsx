import Text from "@/components/ui/Text";
import { StayPricingItem } from "@/definitions/booking";
import { StayAvailabilityItem } from "@/definitions/booking";
import useQuery from "@/hooks/useQuery";
import { LegendList } from "@legendapp/list";
import moment from "moment";
import { memo, useCallback, useEffect, useState, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import Ziew from "@/components/ui/View";
import { useCurrency } from "@/context/CurrencyContext";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import Loader from "@/components/ui/Loader";
import { logAxiosError } from "@/utils/network";
import { useBooking } from "@/context/BookingContext";

const Len = 8;

const Calendar = memo(
  ({
    inventoryId,
    operatorCode,
    initDiff,
  }: {
    inventoryId: number;
    operatorCode: string;
    initDiff: number;
  }) => {
    const [lastI, setLastI] = useState<number>(Len);

    const [dateData, setDateData] = useState<
      { availability: StayAvailabilityItem; pricing: StayPricingItem }[]
    >([]);

    const [checkin, checkout] = useMemo(() => {
      return [
        moment()
          .add(Math.max(1, initDiff + lastI - Len), "days")
          .format("YYYY-MM-DD"),
        moment()
          .add(initDiff + lastI, "days")
          .format("YYYY-MM-DD"),
      ];
    }, [initDiff, lastI]);

    const { data: availability, isLoading } = useQuery(
      "STAY_AVAILABILITY",
      {
        enabled: Boolean(inventoryId && operatorCode),
        select: (data) => data.data,
        throwOnError: (er) => {
          logAxiosError(er);
          return false;
        },
      },
      {
        search: {
          room_ids: String(inventoryId),
          property_code: operatorCode,
          checkin,
          checkout,
        },
      }
    );

    const { formatCurrency } = useCurrency();

    useEffect(() => {
      if (availability) {
        const newList = availability.availability.map((el, index) => {
          return {
            availability: el,
            pricing: availability.pricing[index],
          };
        });
        setDateData((prev) => prev.concat(newList));
      }
    }, [availability]);

    const onEndReached = useCallback(() => {
      if (!isLoading) {
        setLastI((lastI) => lastI + 8);
      }
    }, [isLoading]);

    const renderItem = useCallback(
      ({
        item,
      }: {
        item: { availability: StayAvailabilityItem; pricing: StayPricingItem };
      }) => {
        const date = moment(item.availability.date);
        return (
          <Ziew background="Secondary" style={styles.itemContainer}>
            <Text type="Small" color="Secondary" center numberOfLines={2}>
              {date.format("ddd")}
            </Text>
            <Text type="Small" color="Secondary" center numberOfLines={2}>
              {date.format("DD MMM")}
            </Text>
            <Text
              style={styles.fitW}
              type="SubtitleHighlight"
              center
              color="Success"
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {item.availability.bookable && item.availability.units > 0
                ? formatCurrency(item.pricing.price)
                : `❌`}
            </Text>
            <Text type="Small" color="Secondary" center numberOfLines={1}>
              {item.availability.units}{" "}
              {item.availability.units > 0 ? "🛏️" : "🛌"}
            </Text>
          </Ziew>
        );
      },
      []
    );

    if (!dateData || dateData.length === 0) {
      return (
        <Animated.View
          style={styles.loader}
          entering={FadeIn}
          exiting={FadeOut}
        >
          <Loader />
        </Animated.View>
      );
    }

    return (
      <View>
        <LegendList
          data={dateData}
          estimatedItemSize={56}
          keyExtractor={(item) => item.availability.date}
          horizontal
          onEndReachedThreshold={0.36}
          style={styles.listContainer}
          snapToAlignment="start"
          decelerationRate="fast"
          snapToInterval={56}
          onEndReached={onEndReached}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContentContainer}
          renderItem={renderItem}
        />
      </View>
    );
  }
);

const AvailabilityCalendar = memo(
  ({
    inventoryId,
    operatorCode,
  }: {
    inventoryId: number;
    operatorCode: string;
  }) => {
    const { startDate: date } = useBooking();

    const initDiff = useMemo(() => {
      return moment(date).diff(moment(), "days");
    }, [date]);

    return (
      <Calendar
        inventoryId={inventoryId}
        operatorCode={operatorCode}
        initDiff={initDiff}
        key={initDiff}
      />
    );
  }
);

const styles = StyleSheet.create({
  listContainer: {
    height: 80,
  },
  listContentContainer: {
    gap: 8,
    paddingHorizontal: 16,
  },
  itemContainer: {
    width: 56,
    height: 80,
    borderRadius: 100,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  fitW: {
    width: "100%",
  },
  loader: {
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default memo(AvailabilityCalendar);
