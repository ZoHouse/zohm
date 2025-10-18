import {
  FormGuest,
  StayAvailabilityItem,
  StayPricingItem,
} from "@/definitions/booking";
import { values } from "./object";

export const isValidGuest = (guest: FormGuest) => {
  return (
    guest.firstName &&
    (!guest.isFirst ? true : guest.email) &&
    guest.phone &&
    guest.gender?.value
  );
};

export const minPrice = (pricing: StayPricingItem[]) => {
  const map: Record<number, { len: number; sum: number }> = {};
  let minPrice = Infinity;

  pricing.forEach((price) => {
    const current = map[price.room_id] ?? { len: 0, sum: 0 };
    current.len += 1;
    current.sum += price.price;
    map[price.room_id] = current;
  });

  values(map).forEach((val) => {
    minPrice = Math.min(minPrice, val.sum / val.len);
  });

  return minPrice === Infinity ? 0 : minPrice;
};

export const checkIfSoldOut = (availability: StayAvailabilityItem[]) => {
  const roomAvMap: Record<number, boolean> = {};
  if (!availability.length) return true;
  availability.forEach((av) => {
    if (roomAvMap[av.room_id] === undefined) {
      roomAvMap[av.room_id] = true;
    }
    roomAvMap[av.room_id] =
      roomAvMap[av.room_id] && av.units > 0 && av.bookable;
  });
  return values(roomAvMap).every((value) => value === false);
};
