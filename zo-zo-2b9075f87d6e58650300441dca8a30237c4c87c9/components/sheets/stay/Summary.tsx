import { CouponResponse } from "@/definitions/booking";
import moment from "moment";
import { StyleSheet, View } from "react-native";
import { Sheet } from "@/components/sheets";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import React, { useCallback, useMemo } from "react";
import { useBooking } from "@/context/BookingContext";
import { formatJson, groupBy } from "@/utils/object";
import {
  SafeAreaView,
  SectionTitle,
  Pressable,
  Iconz,
  Text,
  Button,
  DashedBorder,
  View as Ziew,
} from "@/components/ui";
import Logger from "@/utils/logger";

const getRoomDetails = (
  roomInfo: Record<number, { name: string; price: number; count: number }>,
  diff: number,
  formatCurrency: (price: number) => string
) => {
  const result: SummaryItem[] = Object.values(roomInfo).flatMap((roomInfo) => [
    {
      label: `${roomInfo.name as string} x ${roomInfo.count}`,
      isThickValue: false,
      value: "",
    },
    {
      label: `${formatCurrency(roomInfo.price * roomInfo.count)} x ${diff} ${
        diff > 1 ? "Nights" : "Night"
      }`,
      isThickValue: true,
      value: formatCurrency(roomInfo.price * roomInfo.count * diff),
    },
    "divider",
  ]);

  return result;
};

interface SummarySheetProps {
  isOpen: boolean;
  couponResponse: CouponResponse;
  onClose: () => void;
  onBook: () => void;
  formatCurrency: (price: number) => string;
}

type SummaryItem =
  | {
      label: string;
      value?: string;
      isGreen?: boolean;
      isThickValue?: boolean;
    }
  | "divider";

const SummarySheet: React.FC<SummarySheetProps> = ({
  isOpen,
  couponResponse,
  onClose,
  onBook,
  formatCurrency,
}) => {
  const closeIcon = useMemo(
    () => (
      <Pressable activeOpacity={0.8} onPress={onClose}>
        <Iconz name="cross" size={24} />
      </Pressable>
    ),
    [onClose]
  );

  const { duration, startDate, endDate } = useBooking();

  const groupedRoomInfo = useMemo(
    () => getGroupedRoomInfo(couponResponse, duration),
    [couponResponse, duration]
  );

  const roomInfo = useMemo(
    () => getRoomDetails(groupedRoomInfo, duration, formatCurrency),
    [groupedRoomInfo, duration, formatCurrency]
  );

  const logInfo = useCallback(() => {
    if (couponResponse && groupedRoomInfo) {
      Logger.beginCheckout(
        couponResponse.advance_amount,
        groupedRoomInfo,
        couponResponse.operator.name
      );
    }
  }, [couponResponse, groupedRoomInfo]);

  const handleBook = useCallback(() => {
    onClose();
    logInfo();
    onBook();
  }, [onBook, onClose, logInfo]);

  const rowItems: SummaryItem[] = [
    ...roomInfo,
    {
      label: "Stay Total",
      value: formatCurrency(
        couponResponse.final_amount + (couponResponse.offer_discount || 0)
      ),
    },
    {
      label: "Tax",
      value: formatCurrency(couponResponse.tax_amount),
    },
    couponResponse.offer_discount
      ? {
          label: "Offer Discount",
          value: `-${formatCurrency(couponResponse.offer_discount)}`,
        }
      : null,
    {
      label: "Grand Total",
      isThickValue: true,
      value: formatCurrency(couponResponse.total_amount),
    },
    {
      label: "Payable Now",
      isGreen: true,
      value: formatCurrency(couponResponse.advance_amount),
    },
  ].filter(Boolean) as SummaryItem[];

  return (
    <Sheet
      isOpen={isOpen}
      onDismiss={onClose}
      enableDynamicSizing
      maxDynamicContentSize={640}
    >
      <BottomSheetScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        style={styles.flex}
      >
        <SectionTitle type="Title" content={closeIcon}>
          Summary
        </SectionTitle>
        <View style={styles.container}>
          {rowItems.map((el, index) =>
            el === "divider" ? (
              <DashedBorder key={index} style={styles.noMv} />
            ) : (
              <View key={index} style={styles.row}>
                <View style={styles.flex}>
                  <Text color={el.isGreen ? "Success" : undefined}>
                    {el.label}
                  </Text>
                </View>
                {el.value && (
                  <Text
                    type={
                      el.isThickValue || el.isGreen
                        ? "TextHighlight"
                        : undefined
                    }
                    color={el.isGreen ? "Success" : undefined}
                  >
                    {el.value}
                  </Text>
                )}
              </View>
            )
          )}
        </View>
      </BottomSheetScrollView>
      <Ziew style={styles.bottom} background="Sheet">
        <SafeAreaView safeArea="bottom">
          <View style={styles.bottomBar}>
            <View style={styles.flex}>
              <Text type="Subtitle" style={styles.underline}>
                {moment(startDate).format("DD MMM")} -{" "}
                {moment(endDate).format("DD MMM")}
              </Text>
              <Text type="Subtitle">
                Payable Now {formatCurrency(couponResponse.advance_amount)}
              </Text>
              <Text type="Tertiary" color="Secondary">
                Total: {formatCurrency(couponResponse.total_amount)} •{" "}
                {duration} Night
                {duration > 1 ? "s" : ""}
              </Text>
            </View>
            <View>
              <Button style={styles.bookNow} onPress={handleBook}>
                Book Now
              </Button>
            </View>
          </View>
        </SafeAreaView>
      </Ziew>
    </Sheet>
  );
};

export default SummarySheet;

const styles = StyleSheet.create({
  bookNow: { paddingHorizontal: 16 },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  noMv: { marginVertical: 8 },
  scroll: { paddingBottom: 128 },
  container: {
    flex: 1,
    alignSelf: "stretch",
    paddingHorizontal: 24,
    gap: 8,
  },
  sheet: { flex: 1, alignSelf: "stretch" },
  underline: { textDecorationLine: "underline" },
  bottom: { position: "absolute", width: "100%", bottom: 0 },
});

const getGroupedRoomInfo = (couponResponse: CouponResponse, diff: number) => {
  const roomInfo: Record<
    number,
    { name: string; price: number; count: number }
  > = {};

  const groupedRooms = groupBy(couponResponse.rooms, "id");

  Object.entries(groupedRooms).forEach(([id, rooms]) => {
    if (!rooms.length) return;
    if (!roomInfo[+id]) {
      roomInfo[+id] = {
        name: rooms[0].inventory.name,
        price: rooms[0].price,
        count: 0,
      };
    }
    roomInfo[+id].count = rooms.length / diff;
  });

  return roomInfo;
};
