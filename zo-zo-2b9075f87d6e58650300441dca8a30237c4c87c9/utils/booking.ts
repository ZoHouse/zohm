import {
  FeedAvailabilityItem,
  FeedPricingItem,
  StayBooking,
} from "@/definitions/booking";
import { Operator, Room } from "@/definitions/discover";

/**
 * Shows the adult and kids warning if the operator has an age restriction.
 * @param operator - The operator to check.
 * @returns An object containing the show state and the age.
 */
export const showAdultAndKidsWarning = (operator?: Operator) => {
  if (!operator) return { show: false, age: 18 };
  const show = Boolean(
    operator.age_restriction && operator.age_restriction !== "0"
  );
  const age = Number(operator.age_restriction ?? 18) || 18;
  return {
    show,
    age,
  };
};

/**
 * Sorts rooms based on their availability and priority.
 * @param roomA - The first room to compare.
 * @param roomB - The second room to compare.
 * @returns A number indicating the order of the rooms.
 */
// TODO
export const roomSorter = (
  roomA: Room,
  roomB: Room,
  pricing?: Record<string, FeedPricingItem | undefined>,
  availability?: Record<string, FeedAvailabilityItem | undefined>
) => {
  if (!pricing || !availability) {
    return 0; // don't break sort if data missing
  }

  const pa = pricing[roomA.id]?.price ?? 0;
  const pb = pricing[roomB.id]?.price ?? 0;

  const ava = availability[roomA.id];
  const avb = availability[roomB.id];

  const aAvailable = !!(ava?.available && ava.units > 0);
  const bAvailable = !!(avb?.available && avb.units > 0);

  // If one is available and the other is not → available comes first
  if (aAvailable && !bAvailable) return -1;
  if (!aAvailable && bAvailable) return 1;

  // If both unavailable → keep their relative order (stable)
  if (!aAvailable && !bAvailable) return 0;

  // Both available → sort by price ascending
  return pa - pb;
};

export const getBookingDetailPaymentInfo = (
  booking: StayBooking,
  formatCurrency: (amount: number) => string,
  totalAmountDue: number
) => {
  const list: {
    label: string;
    value: string;
    bold?: boolean;
    boldR?: boolean;
  }[] = [];
  list.push({
    label: "Stay Total",
    value: formatCurrency(booking.amount),
  });
  if (booking.offer_discount + booking.discount) {
    list.push({
      label: "Offer Discount",
      value: "- " + formatCurrency(booking.offer_discount + booking.discount),
    });
  }
  list.push({
    label: "Taxes",
    value: formatCurrency(booking.tax_amount),
  });
  if (booking.total_addon_amount) {
    list.push({
      label: "Add-Ons",
      value: formatCurrency(booking.total_addon_amount),
    });
  }

  list.push({
    label: "Grand Total",
    value: formatCurrency(booking.total_amount),
    boldR: true,
  });

  const highlightedList: typeof list = [];

  if (booking.status === "cancelled") {
    highlightedList.push({
      label: "Already paid",
      value: formatCurrency(booking.paid_amount),
      bold: true,
    });
  } else {
    highlightedList.push({
      label: "Already paid",
      value: "- " + formatCurrency(booking.paid_amount),
      boldR: true,
    });

    highlightedList.push({
      label: "Amount due",
      value: formatCurrency(totalAmountDue),
      bold: true,
    });
  }

  return { paymentList: list, paymentHighlightedList: highlightedList };
};
