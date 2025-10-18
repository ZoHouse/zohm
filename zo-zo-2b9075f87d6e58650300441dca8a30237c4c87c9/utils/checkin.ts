import { BookingGuest, StayBooking } from "@/definitions/booking";
import { ZostelProfile } from "@/definitions/profile";

export const getCheckinInfo = (
  bookingData?: StayBooking,
  profile?: ZostelProfile,
  checkedIn: boolean = false
): {
  otherGuests: BookingGuest[];
  isSelfCheckInDone: boolean;
  checkedInGuests: BookingGuest[];
  nonCheckedInGuests: BookingGuest[];
  guestCheckinMessage: string;
  finishedCheckinMessage: string;
} => {
  const otherGuests = (bookingData?.guests ?? [])
    // .flatMap((r: GeneralObject) => r.guest)
    .filter((g) => g.mobile !== profile?.mobile)
    .filter((g) => Boolean(g.name));

  const isSelfCheckInDone =
    checkedIn ||
    !!(bookingData?.checkins ?? []).find(
      (f) => f.user.mobile === profile?.mobile
    );

  const [checkedInGuests, nonCheckedInGuests] = otherGuests.reduce(
    (acc: [BookingGuest[], BookingGuest[]], guest: BookingGuest) => {
      const isCheckedIn = (bookingData?.checkins ?? []).find(
        (f) => f.user.mobile === guest.mobile
      );
      if (isCheckedIn) {
        acc[0].push(guest);
      } else {
        acc[1].push(guest);
      }
      return acc;
    },
    [[], []]
  );

  const guestCheckinMessage = getCheckinMessage(nonCheckedInGuests);
  const finishedCheckinMessage = getFinishedCheckinMessage(
    isSelfCheckInDone,
    checkedInGuests
  );

  return {
    otherGuests,
    isSelfCheckInDone,
    checkedInGuests,
    nonCheckedInGuests,
    guestCheckinMessage,
    finishedCheckinMessage,
  };
};

const getFinishedCheckinMessage = (
  selfCheckedIn: boolean,
  checkedInGuests: BookingGuest[]
) => {
  const names = checkedInGuests.map((g) => g.first_name);

  if (names.length === 0) {
    return selfCheckedIn ? "You finished web check-in." : "";
  }

  if (selfCheckedIn) {
    if (names.length === 1) {
      return `You & ${names[0]} finished web check-in.`;
    } else if (names.length === 2) {
      return `You, ${names[0]} & ${names[1]} finished web check-in.`;
    } else {
      return `You, ${names[0]} & ${
        names.length - 1
      } more finished web check-in.`;
    }
  } else {
    if (names.length === 1) {
      return `${names[0]} finished web check-in.`;
    } else if (names.length === 2) {
      return `${names[0]} & ${names[1]} finished web check-in.`;
    } else if (names.length === 3) {
      return `${names[0]}, ${names[1]} & ${names[2]} finished web check-in.`;
    } else {
      return `${names[0]}, ${names[1]} & ${
        names.length - 2
      } more finished web check-in.`;
    }
  }
};

const getCheckinMessage = (nonCheckedInGuests: BookingGuest[]) => {
  const names = nonCheckedInGuests.map((g) => g.first_name);
  if (names.length === 0) {
    return "";
  }

  if (names.length === 1) {
    return `Ask ${names[0]} to finish web check-in!`;
  } else if (names.length === 2) {
    return `Ask ${names[0]} & ${names[1]} to finish web check-in!`;
  } else if (names.length === 3) {
    return `Ask ${names[0]}, ${names[1]} & ${names[2]} to finish web check-in!`;
  } else {
    return `Ask ${names[0]}, ${names[1]} & ${names.length - 2} more ${
      names.length - 2 === 1 ? "friend" : "friends"
    } to finish web check-in!`;
  }
};
