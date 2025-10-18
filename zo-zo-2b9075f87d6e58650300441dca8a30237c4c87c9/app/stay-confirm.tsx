// React and React Native imports
import { StyleSheet, View } from "react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import moment from "moment";
import { router, useLocalSearchParams, useRouter } from "expo-router";
import {
  View as Ziew,
  Text,
  Iconz,
  Divider,
  SectionTitle,
  CheckBox,
  Pressable,
  Button,
  GradientHeader,
  SafeAreaView,
  Confetti,
  Loader,
} from "@/components/ui";
import { CancellationPolicy } from "@/components/sheets/stay";
import useMutation from "@/hooks/useMutation";
import useVisibilityState from "@/hooks/useVisibilityState";
import useProfile from "@/hooks/useProfile";
import useCredits from "@/hooks/useCredit";
import { useCurrency } from "@/context/CurrencyContext";
import { Booking, CouponResponse } from "@/definitions/booking";
import { FormGuest, StayBooking } from "@/definitions/booking";
import { GeneralObject } from "@/definitions/general";
import { logAxiosError } from "@/utils/network";
import { groupBy } from "@/utils/object";
import { useToggleState } from "@/utils/hooks";
import { isValidGuest } from "@/utils/stay";
import {
  getGuestFullName,
  profileCountryToCode,
  ProfileFields,
} from "@/utils/profile";
import { joinArrayOfStrings } from "@/utils/data-types/string";
import { showToast } from "@/utils/toast";
import { axiosInstances } from "@/utils/auth/client";
import { AlertSheet, HTMLSheet } from "@/components/sheets";
import {
  ConfirmRoomCard,
  CouponSection,
  GuestRow,
} from "@/components/helpers/stay";
import helpers from "@/utils/styles/helpers";

const useFetchParams = () => {
  const params = useLocalSearchParams();
  const { checkin, checkout, property_code, rooms: roomParams } = params;

  const rooms = useMemo(
    () =>
      typeof roomParams === "string"
        ? roomParams.split("|").map((r) => {
            const [id, _ref, count, offer_id] = r.split(",");
            return {
              id: Number(id),
              count: Number(count),
              _ref,
              offer_id: offer_id ? Number(offer_id) : undefined,
            };
          })
        : [],
    [roomParams]
  );

  return {
    checkin: checkin as string,
    checkout: checkout as string,
    property_code: property_code as string,
    rooms: rooms as Booking["rooms"],
  };
};

const StayConfirm = () => {
  const { checkin, checkout, property_code, rooms } = useFetchParams();

  const checkInDate = useMemo(() => moment(checkin), []);
  const checkOutDate = useMemo(() => moment(checkout), []);
  const diff = checkOutDate.diff(checkInDate, "days");

  const { mutateAsync: applyCoupon } = useMutation(
    "STAY_BOOKINGS_APPLY_COUPON"
  );
  const { mutateAsync: createBooking } = useMutation("STAY_BOOKINGS", {});
  const [couponResponse, setCouponResponse] = useState<CouponResponse>();
  const { credits } = useCredits(true);

  const [isCreatingBooking, setIsCreatingBooking] = useState(false);

  const hitCoupon = useCallback((coupon: string = "") => {
    const data: Booking = {
      checkin,
      checkout,
      property_code,
      rooms,
    };
    if (coupon) {
      data.coupon_code = coupon;
    }
    return applyCoupon(data)
      .then((res) => res.data.booking)
      .then((res) => {
        setCouponResponse(res);
        return res;
      })
      .catch((err) => {
        logAxiosError(err);
        setCouponResponse(undefined);
      });
  }, []);

  useEffect(() => {
    hitCoupon();
  }, []);

  const bookedRooms = useMemo(() => {
    if (!couponResponse) return [];
    const group = groupBy(couponResponse?.rooms, "id");
    return Object.keys(group).map((id) => {
      const room = group[+id][0];
      return {
        id,
        ...room.inventory,
        count: group[+id].length / diff,
        price: room.price,
        total_amount: room.total_amount,
        final_amount: room.final_amount,
        occupancy: room.occupancy,
      };
    });
  }, [couponResponse?.rooms.length]);

  const [minOccupancy, _, initGuestList] = useMemo(() => {
    const minOccupancy = bookedRooms.reduce((occ, room) => occ + room.count, 0);

    const maxOccupancy = bookedRooms.reduce(
      (occ, room) => occ + (room.occupancy ?? 1) * room.count,
      0
    );

    const list: FormGuest[] = [];
    for (let i = 0; i < maxOccupancy; i++) {
      list.push({
        firstName: "",
        lastName: "",
        gender: undefined,
        phone: "",
        email: "",
        isOptional: i >= minOccupancy,
        isFirst: i === 0,
        countryCode: {
          name: "India",
          flag: "🇮🇳",
          code: "IN",
          dial_code: "+91",
        },
      });
    }

    return [minOccupancy, maxOccupancy, list];
  }, [bookedRooms.length]);

  const { totalFemaleUnits, femaleAlertDescription } = useMemo(() => {
    const allFemaleRooms: GeneralObject[] =
      bookedRooms?.filter((r: any) =>
        r.name.toLowerCase().includes("female")
      ) ?? [];

    const totalFemaleUnits: number = allFemaleRooms
      .map((el: any) => el.count)
      .reduce((ac: number, el: number) => ac + el, 0);

    const femaleRoomNames: string = joinArrayOfStrings(
      allFemaleRooms.map((el: any) => el.name) ?? []
    );

    const warningDescription = femaleRoomNames
      ? `You have selected ${femaleRoomNames} but there are not enough females in guest list. Please check the gender of guests or choose an appropriate room.`
      : "";

    return {
      totalFemaleUnits,
      femaleAlertDescription: warningDescription,
    };
  }, [bookedRooms]);

  const checkInCheckOut = useMemo(
    () => (
      <View style={styles.checkInCheckOut}>
        <View>
          <Text type="Subtitle">Check-In</Text>
          <Text type="TextHighlight">
            {checkInDate.format("ddd, DD MMM 'YY")}
          </Text>
        </View>
        <Iconz name="arrow-right" size={24} />
        <View>
          <Text type="Subtitle">Check-Out</Text>
          <Text type="TextHighlight">
            {checkOutDate.format("ddd, DD MMM 'YY")}
          </Text>
        </View>
      </View>
    ),
    []
  );

  const bookedRoomsView = useMemo(
    () => (
      <View style={styles.bookedRoomsView}>
        {bookedRooms.map((room) => (
          <ConfirmRoomCard room={room} totalNights={diff} key={room.id} />
        ))}
      </View>
    ),
    [bookedRooms]
  );

  const [guestDetails, setGuestDetails] = useState<FormGuest[]>([]);
  const setGuest = useCallback((guest: FormGuest, index: number) => {
    setGuestDetails((prev) => {
      const newGuests = [...prev];
      newGuests[index] = guest;
      return newGuests;
    });
  }, []);

  const { profile, zostelProfile } = useProfile();

  useEffect(() => {
    if (profile) {
      const firstGuest: FormGuest = {
        firstName: profile.first_name,
        lastName: profile.last_name ?? "",
        gender: ProfileFields.gender.find((g) => g.id === profile.gender),
        isFirst: true,
        email: profile.email_address,
        phone: zostelProfile?.mobile,
        countryCode: profileCountryToCode(profile.country),
      };
      const newGuestList = [...initGuestList];
      newGuestList[0] = firstGuest;
      setGuestDetails(newGuestList);
    }
  }, [initGuestList, profile, zostelProfile]);

  const guestsInfo = useMemo(
    () => (
      <View>
        <SectionTitle noHorizontalPadding>Guests Info</SectionTitle>
        <View
          style={{
            borderRadius: 16,
            overflow: "hidden",
            borderCurve: "continuous",
            gap: 1,
          }}
        >
          {guestDetails.map((guest, index) => (
            <GuestRow
              guest={guest}
              index={index}
              key={index}
              setGuest={setGuest}
            />
          ))}
        </View>
      </View>
    ),
    [guestDetails]
  );

  const offersInfo = useMemo(
    () => (
      <View>
        <CouponSection applyCouponCode={hitCoupon} />
      </View>
    ),
    []
  );

  const validGuests = useMemo(() => {
    return guestDetails.filter(isValidGuest);
  }, [guestDetails]);

  const guestsFilled = validGuests.length >= minOccupancy;

  const { formatCurrency } = useCurrency();

  const paymentInfoRows = useMemo(() => {
    if (!couponResponse) return [];
    const rows: {
      label: string;
      value: string;
      boldValue?: boolean;
      boldRow?: boolean;
      highlight?: boolean;
    }[] = [];

    rows.push({
      label: "Stay Total",
      value: formatCurrency(
        couponResponse.final_amount + (couponResponse.offer_discount || 0)
      ),
    });

    if (couponResponse.offer_discount) {
      rows.push({
        label: "Offer Discount",
        value: "- " + formatCurrency(couponResponse.offer_discount),
      });
    }

    if (couponResponse.discount) {
      rows.push({
        label: "Coupon Discount ",
        value: "- " + formatCurrency(couponResponse.discount),
      });
    }

    rows.push({
      label: "Taxes",
      value: formatCurrency(couponResponse.tax_amount),
    });

    rows.push({
      label: "Grand Total",
      value: formatCurrency(couponResponse.total_amount),
    });

    rows.push({
      label: "Payable Now",
      value: formatCurrency(couponResponse.advance_amount),
      highlight: true,
    });

    return rows;
  }, [couponResponse]);

  const paymentInfo = useMemo(
    () => (
      <View>
        <SectionTitle noHorizontalPadding>Payment Info</SectionTitle>
        <View style={styles.gap}>
          {paymentInfoRows.map((row, index) => (
            <Ziew
              style={[
                styles.paymentRow,
                row.highlight && styles.paymentRowHighlight,
              ]}
              key={index}
              background={row.highlight ? "Card" : undefined}
            >
              <Text type={row.highlight ? "TextHighlight" : "Paragraph"}>
                {row.label}
              </Text>
              <Text
                type={
                  row.highlight || row.boldRow ? "TextHighlight" : "Paragraph"
                }
                style={[
                  styles.paymentRowText,
                  row.boldValue && styles.paymentRowTextBold,
                ]}
              >
                {row.value}
              </Text>
            </Ziew>
          ))}
        </View>
      </View>
    ),
    [paymentInfoRows]
  );

  const minAge = 18;

  const [isZoCreditsAccepted, toggleUseZoCredits] = useToggleState(false);
  const [isDeclarationAccepted, toggleDeclarationAccepted] =
    useToggleState(false);
  const [isAdultWarningAccepted, toggleAdultWarningAccepted] =
    useToggleState(false);
  const [isPolicyOpened, openPolicy, closePolicy] = useVisibilityState(false);
  const [
    isCancellationPolicyOpened,
    openCancellationPolicy,
    closeCancellationPolicy,
  ] = useVisibilityState(false);
  const [isGenderAlertOpened, showGenderAlert, hideGenderAlert] =
    useVisibilityState(false);

  const declaration = useMemo(
    () => (
      <View style={styles.declaration}>
        {credits && credits.balance > 0 ? (
          <Pressable
            onPress={toggleUseZoCredits}
            style={styles.declarationItem}
            activeOpacity={0.8}
          >
            <CheckBox isSelected={isZoCreditsAccepted} size={16} />
            <Text type="Subtitle" style={styles.declarationText}>
              Use Zo Credits{"\n"}Available Balance {credits?.value}
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={toggleDeclarationAccepted}
          style={styles.declarationItem}
          activeOpacity={0.8}
        >
          <CheckBox isSelected={isDeclarationAccepted} size={16} />
          <Text type="Subtitle" style={styles.declarationText}>
            By booking, you agree to our{" "}
            <Text onPress={openPolicy} type="SubtitleHighlight">
              Property Policy
            </Text>{" "}
            and{" "}
            <Text onPress={openCancellationPolicy} type="SubtitleHighlight">
              Cancellation Policy
            </Text>
          </Text>
        </Pressable>
        <Pressable
          onPress={toggleAdultWarningAccepted}
          style={styles.declarationItem}
          activeOpacity={0.8}
        >
          <CheckBox isSelected={isAdultWarningAccepted} size={16} />
          <Text style={styles.declarationText} type="Subtitle">
            {`I accept that all guests are ${minAge}+ and no kids/infants are traveling with me.`}
          </Text>
        </Pressable>
      </View>
    ),
    [
      isZoCreditsAccepted,
      isDeclarationAccepted,
      isAdultWarningAccepted,
      credits,
    ]
  );

  const isDeclarationFilled = useMemo(() => {
    return isDeclarationAccepted && isAdultWarningAccepted;
  }, [isDeclarationAccepted, isAdultWarningAccepted]);

  const { navigate } = useRouter();

  const onProceed = () => {
    const femaleGuestsCount = validGuests.filter(
      (g) => g.gender?.id === "female"
    ).length;
    if (femaleGuestsCount < totalFemaleUnits) {
      showGenderAlert();
      return;
    }
    const formattedGuests = validGuests.map((g) => ({
      name: getGuestFullName(g),
      mobile: `${g.countryCode?.dial_code ?? ""}${g.phone}`.replace("+", ""),
      gender: ProfileFields.gender.findIndex(
        (pg) => g.gender?.id === pg.id || pg.value === g.gender?.value
      ),
      email: g.email,
    }));
    if (formattedGuests.find((g) => g.name.length < 3)) {
      showToast({
        message: "Guest's name must be at least 3 characters long.",
        type: "error",
      });
      return;
    }
    setIsCreatingBooking(true);
    const _data: GeneralObject = {
      checkin: checkInDate.format("YYYY-MM-DD"),
      checkout: checkOutDate.format("YYYY-MM-DD"),
      coupon_code: couponResponse?.coupon_code,
      property_code: property_code,
      // rooms: bookedRooms.map((r) => ({
      //   id: r.id,
      //   _ref: r.id,
      //   count: r.count,
      // })),
      rooms,
      guests: formattedGuests,
    };
    createBooking(_data)
      .then((res) => {
        if (res.status === 201) {
          return res.data.booking;
        }
        throw new Error("Failed to create booking");
      })
      .then((booking) => {
        const code = booking.code;
        return (
          axiosInstances.ZOSTEL.post(`/api/v2/stay/bookings/${code}/payment/`, {
            credits_to_spend: isZoCreditsAccepted
              ? credits?.shortBalance || 0
              : 0,
            pay_in_full: false,
          })
            // return createBooking({
            //   credits_to_spend: isZoCreditsAccepted ? credits?.shortBalance : 0,
            //   pay_in_full: false,
            // })
            .then((res) => res.data.payments as StayBooking["payments"])
            .then((payments) => ({
              payments,
              code,
            }))
        );
      })
      .then(({ payments, code }) => {
        const payment = payments.filter(
          (p) => p.payment_mode === "PG via Payment Gateway"
        )[0];
        navigate({
          pathname: "/payment",
          params: {
            pid: code,
            bypass: !payment ? "true" : undefined,
          },
        });
      })
      .catch((er) => {
        logAxiosError(er);
        showToast({ message: "Failed to create booking", type: "error" });
      })
      .finally(() => {
        setIsCreatingBooking(false);
      });
  };

  return (
    <Ziew background style={styles.screen}>
      <GradientHeader y={0.64}>
        <View style={styles.head}>
          <Pressable onPress={router.back}>
            <Iconz name="arrow-left" size={24} />
          </Pressable>
        </View>
      </GradientHeader>
      <Animated.ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        <SafeAreaView safeArea="top" style={styles.userinfo} />
        <SectionTitle noHorizontalPadding type="Title">
          Review Your Details
        </SectionTitle>
        {checkInCheckOut}
        <Divider />
        {couponResponse ? (
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            key="content"
            style={styles.content}
          >
            <SectionTitle noHorizontalPadding>Rooms Info</SectionTitle>
            {bookedRoomsView}
            <Divider />
            {guestsInfo}
            <Divider marginTop={16} />
            {offersInfo}
            <Divider marginTop={16} />
            {paymentInfo}
            <Divider marginTop={16} marginBottom={16} />
            {declaration}
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            key="loader"
            style={helpers.fitCenter}
          >
            <Loader />
          </Animated.View>
        )}
      </Animated.ScrollView>
      {couponResponse ? (
        <SafeAreaView style={styles.foot} safeArea="bottom">
          {guestsFilled ? (
            <Button
              onPress={onProceed}
              isLoading={isCreatingBooking}
              isDisabled={!isDeclarationFilled}
            >
              Proceed to payment
            </Button>
          ) : (
            <Button isDisabled>Add Guest Details to Continue</Button>
          )}
        </SafeAreaView>
      ) : null}
      {isPolicyOpened && couponResponse?.operator.policy && (
        <HTMLSheet
          isOpen={isPolicyOpened}
          onClose={closePolicy}
          html={couponResponse?.operator.policy}
          title="General Policy"
        />
      )}
      {isCancellationPolicyOpened && couponResponse?.operator && (
        <CancellationPolicy
          isOpen={isCancellationPolicyOpened}
          onDismiss={closeCancellationPolicy}
          operator={couponResponse?.operator}
          checkinDate={couponResponse.checkin}
        />
      )}
      {isGenderAlertOpened && (
        <AlertSheet
          isOpen={isGenderAlertOpened}
          onClose={hideGenderAlert}
          title="Gender mismatch!"
          description={femaleAlertDescription}
          variant="gender"
        />
      )}
      {couponResponse?.coupon_code && couponResponse.discount && <Confetti />}
    </Ziew>
  );
};

export default StayConfirm;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignSelf: "stretch",
  },
  list: {
    flex: 1,
    alignSelf: "stretch",
  },
  listContent: {
    paddingHorizontal: 24,
    gap: 8,
    paddingVertical: 56,
  },
  foot: { paddingHorizontal: 24, marginBottom: 8 },
  userinfo: { marginBottom: -8 },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    height: 56,
    width: "100%",
  },
  gap: { gap: 8 },
  checkInCheckOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 24,
  },
  bookedRoomsView: {
    gap: 24,
    marginVertical: 16,
    marginTop: 0,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  paymentRowHighlight: {
    marginHorizontal: -12,
    padding: 12,
    marginTop: 4,
    borderRadius: 16,
    borderCurve: "continuous",
  },
  paymentRowText: {
    fontWeight: "normal",
  },
  paymentRowTextBold: {
    fontWeight: "bold",
  },
  declaration: {
    gap: 8,
  },
  declarationItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    justifyContent: "flex-start",
  },
  declarationText: {
    flex: 1,
  },
  content: {
    gap: 8,
  },
});

/*

{
  "checkin": "2025-08-14",
  "checkout": "2025-08-15",
  "coupon_code": "",
  "guests": [
    {
      "name": "Varun Bhalla",
      "mobile": "919650605677",
      "gender": 0,
      "email": "varun@zo.xyz",
      "address": "Mail"
    }
  ],
  "property_code": "DLHH524",
  "rooms": [
    {
      "id": 270,
      "_ref": "270",
      "count": 1
    }
  ],
  "track": {
    "utm_source": "",
    "utm_medium": "",
    "utm_campaign": "",
    "utm_referrer": ""
  }
}

*/
