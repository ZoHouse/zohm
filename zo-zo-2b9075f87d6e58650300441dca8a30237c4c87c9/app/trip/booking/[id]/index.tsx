import { openRazorpay } from "@/components/helpers/misc/rzp";
import TripCarousel from "@/components/helpers/trip/TripCarousel";
import { TripInfoShimmer } from "@/components/helpers/trip/TripShimmers";
import AboutTrip from "@/components/sheets/trips/AboutTrip";
import InfoSheet from "@/components/sheets/trips/InfoSheet";
import TripCancellation from "@/components/sheets/trips/TripCancellation";
import {
  Button,
  CheckBox,
  Confetti,
  DashedBorder,
  Divider,
  GradientFooter,
  GradientHeader,
  Iconz,
  Pressable,
  SafeAreaView,
  SectionTitle,
  Text,
  View as Ziew,
} from "@/components/ui";
import DetailList from "@/components/ui/DetailList";
import { SearchResult } from "@/definitions/general";
import {
  TripBooking,
  TripBookingInfo,
  TripItinerary,
} from "@/definitions/trip";
import useDisableAndroidBack from "@/hooks/useDisableAndroidBack";
import useMutation from "@/hooks/useMutation";
import useQuery from "@/hooks/useQuery";
import useVisibilityState from "@/hooks/useVisibilityState";
import { logAxiosError } from "@/utils/network";
import { toMapBy } from "@/utils/object";
import helpers from "@/utils/styles/helpers";
import { showToast } from "@/utils/toast";
import {
  getCurrenciedPrice,
  makeTripsCancellationPolicyList,
  mediaFromItinerary,
} from "@/utils/trips";
import Clipboard from "@react-native-clipboard/clipboard";
import { router, useLocalSearchParams } from "expo-router";
import moment from "moment";
import { useCallback, useMemo, useState } from "react";
import { Linking, ScrollView, Share, StyleSheet, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";

const validBookingStatuses = ["confirmed", "pending", "requested"];
const confirmedStatuses = ["confirmed", "requested"];

const TripBookingScreen = () => {
  const { id, from_payment } = useLocalSearchParams<{
    id: string;
    from_payment?: string;
  }>();
  const [
    isCancellationSheetOpen,
    showCancellationSheet,
    hideCancellationSheet,
  ] = useVisibilityState(false);
  const [isCPOpen, showCancelltionPolicy, hideCancellationPolicy] =
    useVisibilityState(false);

  const { data: tripDetail, refetch } = useQuery(
    "TRIP_BOOKING",
    {
      select: (data) => data.data,
      enabled: !!id,
      throwOnError: (er) => {
        logAxiosError(er);
        return false;
      },
    },
    {
      path: ["bookings", id],
    }
  );

  const { data: cancellationReasons = [] } = useQuery("BOOKINGS_SEED", {
    select: (data) => data.data?.booking?.cancellation_reasons,
  });

  const tripData = tripDetail?.trip;
  const sku = tripData?.skus[0].pid;
  const [startDate, endDate] = useMemo(
    () => [
      moment(tripDetail?.start_at),
      moment(tripDetail?.start_at).add(3, "months"),
    ],
    [tripDetail]
  );

  const { data: itineraryMap, isLoading: isItinerariesLoading } = useQuery<
    "TRIP",
    SearchResult<TripItinerary>,
    Record<string, TripItinerary>
  >(
    "TRIP",
    {
      select: (data) => toMapBy(data.data.results ?? [], "pid"),
      enabled: !!tripDetail?.trip?.pid,
      throwOnError: (er) => {
        logAxiosError(er);
        return false;
      },
    },
    {
      path: [tripDetail?.trip?.pid ?? "", "itineraries"],
    }
  );

  const selectedItinerary =
    tripDetail?.booked_skus.length && itineraryMap
      ? itineraryMap[tripDetail?.booked_skus[0].sku?.itinerary]
      : null;

  const { data: addonData, isLoading: isPricingLoading } = useQuery(
    "TRIP_PRICING",
    {
      select: (data) =>
        data.data.addon_pricing
          .filter((el) =>
            el.prices.some((price) =>
              moment(price.date).isSame(startDate, "date")
            )
          )
          .filter((el) => el.prices.length > 0),
      enabled: !!sku,
      throwOnError: (er) => {
        logAxiosError(er);
        return false;
      },
    },
    {
      search: {
        skus: sku!,
        start_date: startDate.format("YYYY-MM-DD"),
        end_date: endDate.format("YYYY-MM-DD"),
      },
    }
  );

  const title = useMemo(() => {
    const name = tripData?.name;
    return tripDetail?.status === "confirmed"
      ? `Zo Zo Zo! Your booking for ${name} is confirmed 🥳`
      : tripDetail?.status === "pending"
      ? `Your booking for ${name} is pending ⏳`
      : tripDetail?.status === "requested"
      ? `Your booking for ${name} is Paid`
      : `Your booking for ${name} is ${tripDetail?.status}`;
  }, [tripDetail, tripData]);

  const disableBack = useMemo(() => from_payment === "true", [from_payment]);

  useDisableAndroidBack(disableBack);

  const onShare = useCallback(() => {
    if (!tripDetail?.trip?.pid) return;
    const url = `https://www.zostel.com/trips/${
      tripDetail.trip.pid
    }?date=${moment(tripDetail.start_at).format("DD-MM-YYYY")}`;
    const message = `Hey, I've booked this amazing trip on Zostel: ${url}`;
    Share.share({ message });
  }, [tripDetail]);

  const onBackPress = useCallback(() => {
    if (from_payment === "true") {
      router.dismissTo("/(tabs)/explore");
    } else {
      router.back();
    }
  }, [from_payment]);

  const navContent = useMemo(() => {
    return (
      <View style={styles.nav}>
        <Iconz
          size={24}
          onPress={onBackPress}
          name="cross"
          fillTheme="Primary"
        />
        <Iconz size={24} name="share" fillTheme="Primary" onPress={onShare} />
      </View>
    );
  }, [onShare]);

  const onCancellationSuccess = useCallback(() => {
    hideCancellationSheet();
    refetch();
  }, []);

  const tripCancellationSheet = useMemo(
    () =>
      isCancellationSheetOpen &&
      tripDetail && (
        <TripCancellation
          isOpen={isCancellationSheetOpen}
          onClose={hideCancellationSheet}
          trip={tripDetail}
          seed={cancellationReasons}
          onCancellationSuccess={onCancellationSuccess}
          showCP={showCancelltionPolicy}
        />
      ),
    [
      isCancellationSheetOpen,
      tripDetail,
      cancellationReasons,
      onCancellationSuccess,
    ]
  );

  const cancellationPolicySheet = useMemo(() => {
    return isCPOpen ? (
      <InfoSheet
        isOpen={isCPOpen}
        onClose={hideCancellationPolicy}
        title="Cancellation Policy"
        list={makeTripsCancellationPolicyList(
          tripData?.cancellation_policies ?? []
        )}
      />
    ) : null;
  }, [tripData, isCPOpen]);

  const copyBookingId = useCallback(() => {
    if (!tripDetail?.pid) {
      return;
    }
    Clipboard.setString(tripDetail.pid);
    showToast({
      message: "Copied to clipboard",
      visibilityTime: 1000,
    });
  }, [tripDetail?.pid]);

  const tripDetails = useMemo(() => {
    if (!(tripData && tripDetail && selectedItinerary)) {
      return [];
    }
    const result = [
      {
        id: "1",
        emoji: "✈️",
        value: (
          <Text style={helpers.flex}>
            Starts at{" "}
            <Text type="TextHighlight">
              {selectedItinerary.pickup_location}
            </Text>{" "}
            → Ends at{" "}
            <Text type="TextHighlight">{selectedItinerary.drop_location}</Text>
          </Text>
        ),
      },
      {
        id: "2",
        emoji: "🎟️",
        value: (
          <View style={helpers.flexRowBetween}>
            <Text style={helpers.flex}>
              Booking ID: <Text type="TextHighlight">#{tripDetail.pid}</Text>
            </Text>
            <Iconz
              name="copy"
              fillTheme="Primary"
              size={20}
              onPress={copyBookingId}
            />
          </View>
        ),
      },
      {
        id: "3",
        emoji: "🗓️",
        value: (
          <Text style={helpers.flex}>
            <Text type="TextHighlight">
              {moment(tripDetail.start_at).format("DD MMM")}
            </Text>{" "}
            →{" "}
            <Text type="TextHighlight">
              {moment(tripDetail.end_at).format("DD MMM")}
            </Text>
          </Text>
        ),
      },
    ];
    if (selectedItinerary.title && tripDetail.booked_skus[0]?.sku?.name) {
      result.unshift({
        id: "group",
        emoji: "🧑‍🤝‍🧑",
        value: (
          <Text style={helpers.flex}>
            Group:{" "}
            <Text type="TextHighlight">
              {tripDetail.booked_skus[0].sku.name}
            </Text>
          </Text>
        ),
      });
      result.unshift({
        id: "batch",
        emoji: "🗺️",
        value: <Text type="TextHighlight">{selectedItinerary.title}</Text>,
      });
    }
    if (tripDetail.customers.length) {
      result.push({
        id: "4",
        emoji: tripDetail.customers.length > 1 ? "👥" : "👤",
        value: (
          <Text style={helpers.flex}>
            <Text type="TextHighlight">{tripDetail.customers.length}</Text>{" "}
            Guest{tripDetail.customers.length > 1 ? "s" : ""}
          </Text>
        ),
      });
    }
    return result;
  }, [tripData, tripDetail, selectedItinerary]);

  const [isAboutSheetOpen, showAboutSheet, hideAboutSheet] =
    useVisibilityState(false);

  const aboutSheet = useMemo(() => {
    return isAboutSheetOpen && tripData && selectedItinerary ? (
      <AboutTrip
        isOpen={isAboutSheetOpen}
        onDismiss={hideAboutSheet}
        trip={tripData}
        itinerary={selectedItinerary}
      />
    ) : null;
  }, [isAboutSheetOpen, tripData, selectedItinerary]);

  const bookedAddons = useMemo(
    () => {
      const addons = (tripDetail?.booked_skus ?? [])
        .map((el) => el.booked_addons ?? [])
        .flat();

      const map: Record<string, (typeof addons)[number]> = {};
      addons.forEach((el) => {
        if (map[el.addon_id]) {
          map[el.addon_id] = {
            ...el,
            units: map[el.addon_id].units + el.units,
          };
        }
      });
      return map;
    },
    // .reduce((acc, el) => {
    //   if (acc[el.addon_id]) {
    //     acc[el.addon_id] = {
    //       ...el,
    //       units: acc[el.addon_id].units + el.units,
    //     };
    //   } else {
    //     acc[el.addon_id] = { ...el };
    //   }
    //   return acc;
    // }, {})
    [tripDetail]
  );

  const paymentRows = useMemo(
    () => (tripDetail ? getPaymentRows(tripDetail) : []),
    [tripDetail]
  );

  const pendingPayments = useMemo(
    () =>
      !(
        tripDetail?.payments &&
        validBookingStatuses.includes(tripDetail?.status ?? "")
      )
        ? []
        : tripDetail.payments.filter(
            (p) =>
              p.status === "in-progress" && p.amount && p.intent === "collect"
          ),
    [tripDetail?.payments, tripDetail?.status]
  );

  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const toggleAddon = useCallback((id: string) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((el) => el !== id) : [...prev, id]
    );
  }, []);

  const extraAddonsCost = useMemo(() => {
    if (!selectedAddons.length || !tripData) return null;
    const price = selectedAddons.reduce((acc, el) => {
      const addon = addonData?.find((addon) => addon.id === el);
      if (!addon) return acc;
      return acc + addon?.prices[0].price_taxed;
    }, 0);
    if (!price) return null;
    return getCurrenciedPrice(price, tripData.currency);
  }, [selectedAddons, addonData, tripData]);

  const { mutateAsync: addAddonApi, isPending: isAddAddonsLoading } =
    useMutation<"BOOKINGS_TRIPS", { addons: string[] }, TripBooking>(
      "BOOKINGS_TRIPS"
    );
  const { mutateAsync: processOrder } = useMutation("PAYMENT_PROCESS_ORDER");
  const { mutateAsync: postPaymentResponse } = useMutation("PAYMENT_RESPONSE");

  const addAddons = useCallback(() => {
    addAddonApi({ addons: selectedAddons, path: `${id}/addons/` })
      .then((data) =>
        (data.data.payments ?? []).find((el) => el.status === "in-progress")
      )
      .then((payment) => {
        if (payment) {
          return processOrder(payment)
            .then((_res) => {
              if (_res.status === 201) {
                return openRazorpay(_res.data, undefined, undefined, "zo");
              }
              return Promise.reject("Try again later");
            })
            .then((data) => postPaymentResponse(data));
        } else {
          return Promise.reject("Try again later");
        }
      })
      .catch((er) => {
        logAxiosError(er);
        showToast({ message: "Something went wrong", type: "error" });
      })
      .finally(() => {
        refetch();
        setSelectedAddons([]);
      });
  }, [addAddonApi, id, selectedAddons, processOrder, postPaymentResponse]);

  const addonsSection = useMemo(() => {
    if (!tripDetail) return null;
    const tripStatusCondition = validBookingStatuses.includes(
      tripDetail.status
    );
    if (!addonData?.length) return null;
    const extraAddons = !tripStatusCondition
      ? []
      : addonData.filter((el) => !bookedAddons?.[el.id]);
    const addedAddons = bookedAddons
      ? addonData.filter((el) => bookedAddons?.[el.id])
      : [];
    if (!extraAddons.length && !addedAddons.length) return null;
    return (
      <>
        <SectionTitle noHorizontalPadding>Add-Ons</SectionTitle>
        <View style={styles.gap}>
          {extraAddons.length ? (
            <View>
              {extraAddons.map((el) => {
                const isSelected = selectedAddons.includes(el.id);
                return (
                  <Pressable
                    style={styles.row}
                    key={el.id}
                    activeOpacity={0.8}
                    onPress={() => toggleAddon(el.id)}
                  >
                    <View style={styles.flex1}>
                      <Text>
                        {el.name}{" "}
                        <Text type="TextHighlight">
                          {getCurrenciedPrice(
                            el.prices[0].price_taxed,
                            el.prices[0].currency
                          )}
                        </Text>
                      </Text>
                      {el.description ? (
                        <Text type="Tertiary" color="Secondary">
                          {el.description}
                        </Text>
                      ) : null}
                    </View>
                    <CheckBox isSelected={isSelected} />
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          {extraAddonsCost ? (
            <Button
              variant="secondary"
              onPress={addAddons}
              isLoading={isAddAddonsLoading}
            >
              Pay {extraAddonsCost}
            </Button>
          ) : null}
          {addedAddons.length ? (
            <>
              {extraAddons.length ? <Divider /> : null}
              <View style={styles.gap}>
                {addedAddons.map((el) => (
                  <View style={styles.row}>
                    <View style={styles.flex1}>
                      <Text>{el.name}</Text>
                      {el.description ? (
                        <Text type="Tertiary" color="Secondary">
                          {el.description}
                        </Text>
                      ) : null}
                    </View>
                    <Text type="TextHighlight">
                      {getCurrenciedPrice(
                        el.prices[0].price_taxed,
                        el.prices[0].currency
                      )}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}
        </View>
        <Divider marginTop={16} />
      </>
    );
  }, [
    addonData,
    addAddons,
    bookedAddons,
    selectedAddons,
    toggleAddon,
    tripDetail,
    extraAddonsCost,
    isAddAddonsLoading,
  ]);

  const [isPendingPaymentLoading, setPendingPaymentLoading] = useState(false);

  const onPay = useCallback((payment: TripBooking["payments"][number]) => {
    setPendingPaymentLoading(true);
    processOrder(payment)
      .then((_res) => {
        if (_res.status === 201) {
          return openRazorpay(_res.data, undefined, undefined, "zo");
        }
        return Promise.reject();
      })
      .then((data) => postPaymentResponse(data))
      .then(() => refetch())
      .catch((er) => {
        logAxiosError(er);
        showToast({ message: "Try again later.", type: "error" });
      })
      .finally(() => {
        setPendingPaymentLoading(false);
      });
  }, []);

  const footer = useMemo(
    () =>
      tripDetail?.currency && pendingPayments?.length ? (
        <GradientFooter style={styles.footG}>
          <>
            {pendingPayments.map((pp) => (
              <Button
                key={pp.client_reference_id}
                onPress={() => onPay(pp)}
                isLoading={isPendingPaymentLoading}
              >
                Pay {getCurrenciedPrice(pp.amount, tripDetail.currency)}
              </Button>
            ))}
          </>
        </GradientFooter>
      ) : null,
    [tripDetail?.currency, pendingPayments, isPendingPaymentLoading]
  );

  const extraContent = useMemo(
    () => (
      <>
        {tripCancellationSheet}
        {cancellationPolicySheet}
        {aboutSheet}
        {footer}
      </>
    ),
    [tripCancellationSheet, cancellationPolicySheet, aboutSheet, footer]
  );

  const sortedMedia = useMemo(() => {
    return !selectedItinerary ? [] : mediaFromItinerary(selectedItinerary);
  }, [selectedItinerary]);

  return (
    <Ziew background style={helpers.stretch}>
      <GradientHeader y={0.5}>{navContent}</GradientHeader>
      {tripData && tripDetail && selectedItinerary ? (
        <Animated.View
          entering={FadeInDown}
          exiting={FadeOutDown}
          style={helpers.stretch}
        >
          <ScrollView
            style={helpers.stretch}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <SafeAreaView safeArea="top" />
            <View style={styles.h} />
            <View style={styles.content}>
              {tripData && sortedMedia.length ? (
                <View style={styles.carouselContainer}>
                  <TripCarousel media={sortedMedia} pid={tripData.pid} />
                </View>
              ) : null}
              <SectionTitle type="Title" noHorizontalPadding>
                {title}
              </SectionTitle>
              <DetailList data={tripDetails} gap={12} style={styles.gap} />
              <Divider marginTop={16} />
              <SectionTitle
                noHorizontalPadding
                icon="rightAngle"
                onPress={showAboutSheet}
              >
                About this trip
              </SectionTitle>
              <Divider />
              {addonsSection}
              <SectionTitle noHorizontalPadding>Payment Info</SectionTitle>
              <View style={styles.gap}>
                {paymentRows.map((row, index) =>
                  row === "border" ? (
                    <DashedBorder key={`border-${index}`} />
                  ) : (
                    <View style={styles.row} key={row.title}>
                      <Text
                        type={row.highlight ? "TextHighlight" : "Paragraph"}
                      >
                        {row.title}
                      </Text>
                      <Text
                        type={row.highlight ? "TextHighlight" : "Paragraph"}
                      >
                        {row.value}
                      </Text>
                    </View>
                  )
                )}
              </View>
              <Divider marginTop={8} />
              {tripData?.cancellation_policies?.length ? (
                <>
                  <SectionTitle
                    icon="rightAngle"
                    noHorizontalPadding
                    onPress={showCancelltionPolicy}
                  >
                    Cancellation Policy
                  </SectionTitle>
                  <Divider />
                </>
              ) : null}
              {tripData?.phone ||
              tripData?.email ||
              tripData?.whatsapp_number ? (
                <>
                  <CallOrEmail
                    phone={tripData?.phone}
                    email={tripData?.email}
                    whatsappNumber={tripData?.whatsapp_number}
                  />
                </>
              ) : null}
              {confirmedStatuses.includes(tripDetail?.status ?? "") ? (
                <>
                  <SectionTitle
                    icon="rightAngle"
                    noHorizontalPadding
                    onPress={showCancellationSheet}
                  >
                    Cancel my trip
                  </SectionTitle>
                </>
              ) : null}
              {pendingPayments.map((p) => (
                <View key={p.client_reference_id} style={styles.blankH} />
              ))}
            </View>
          </ScrollView>
        </Animated.View>
      ) : (
        <Animated.View
          entering={FadeInDown}
          exiting={FadeOutDown}
          style={helpers.stretch}
        >
          <TripInfoShimmer />
        </Animated.View>
      )}
      {extraContent}
      {from_payment === "true" && <Confetti />}
    </Ziew>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignSelf: "stretch",
    paddingTop: 8,
    gap: 8,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    paddingBottom: 8,
  },
  marginTop: {
    marginTop: 16,
  },
  gap: {
    gap: 16,
  },
  flex1: {
    flex: 1,
  },
  ph: {
    paddingHorizontal: 24,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nav: {
    ...helpers.fit,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    height: 56,
    paddingHorizontal: 24,
  },
  contentContainer: {
    flexGrow: 1,
    alignSelf: "stretch",
    paddingBottom: 96,
    paddingHorizontal: 24,
  },
  carouselContainer: {
    borderRadius: 16,
    overflow: "hidden",
    borderCurve: "continuous",
  },
  topRight: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  h: {
    height: 56,
  },
  footG: {
    position: "absolute",
    bottom: 0,
    paddingTop: 24,
    gap: 8,
  },
  blankH: {
    height: 32,
  },
});

type PaymentRow =
  | {
      title: string;
      value: string;
      highlight?: true;
    }
  | "border";

const getPaymentRows = (tripDetail: TripBookingInfo): PaymentRow[] => {
  const rows: PaymentRow[] = [
    {
      title: "Total Amount",
      value: getCurrenciedPrice(tripDetail.price, tripDetail.currency),
    },
    tripDetail.offer_discount
      ? {
          title: "Offer Discount",
          value:
            "-" +
            getCurrenciedPrice(tripDetail.offer_discount, tripDetail.currency),
        }
      : null,
    {
      title: "Tax",
      value: getCurrenciedPrice(tripDetail.tax_amount, tripDetail.currency),
    },
    {
      title: "Final Amount",
      value: getCurrenciedPrice(tripDetail.total_amount, tripDetail.currency),
    },
  ].filter(Boolean) as PaymentRow[];

  if (tripDetail.due_amount) {
    rows.push("border");
    rows.push({
      title: "Amount Due",
      value: getCurrenciedPrice(tripDetail.due_amount, tripDetail.currency),
      highlight: true,
    });
  }

  if (tripDetail.paid_amount) {
    rows.push("border");
    rows.push({
      title: "Amount Paid",
      value: getCurrenciedPrice(tripDetail.paid_amount, tripDetail.currency),
      highlight: true,
    });
    tripDetail.payments.forEach((tripPayment) => {
      if (
        tripPayment.status === "success" &&
        tripPayment.intent === "collect"
      ) {
        rows.push({
          title:
            tripPayment.payment_mode === "credits"
              ? "Paid via Credits"
              : "Paid via Razorpay",
          value: getCurrenciedPrice(tripPayment.amount, tripDetail.currency),
        });
      }
    });
  }
  if (tripDetail.status === "cancelled") {
    rows.push({
      title: "Cancellation Charge",
      value: getCurrenciedPrice(
        tripDetail.total_amount - tripDetail.refund_amount,
        tripDetail.currency
      ),
    });
    rows.push("border");
    rows.push({
      title: "Amount Refunded",
      value: getCurrenciedPrice(tripDetail.refund_amount, tripDetail.currency),
      highlight: true,
    });
    const breakdownRows: PaymentRow[] = [];
    tripDetail.payments.forEach((tripPayment) => {
      if (tripPayment.intent === "refund") {
        breakdownRows.push({
          title:
            tripPayment.payment_mode === "credits"
              ? "Refund to Credits"
              : "Refund to Account",
          value: getCurrenciedPrice(tripPayment.amount, tripDetail.currency),
        });
      }
    });
    rows.push(...breakdownRows);
  }

  return rows;
};

const CallOrEmail = ({
  phone,
  email,
  whatsappNumber,
}: {
  phone?: string;
  email?: string;
  whatsappNumber?: string;
}) => {
  const onCall = useCallback(() => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  }, [phone]);

  const onEmail = useCallback(() => {
    if (!email) return;
    Linking.openURL(`mailto:${email}`);
  }, [email]);

  const onSendWhatsapp = useCallback(() => {
    if (!whatsappNumber) return;
    Linking.openURL(`https://wa.me/${whatsappNumber}`);
  }, [whatsappNumber]);

  return (
    <>
      {whatsappNumber || phone || email ? (
        <SectionTitle noHorizontalPadding>Have questions?</SectionTitle>
      ) : null}
      {whatsappNumber ? (
        <Button variant="secondary" onPress={onSendWhatsapp}>
          WhatsApp Zo
        </Button>
      ) : null}
      {phone || email ? (
        <Text style={styles.marginTop}>
          Unable to WhatsApp?{" "}
          {phone && email ? (
            <>
              <Text
                color="ButtonSecondary"
                type="TextHighlight"
                onPress={onCall}
              >
                Call
              </Text>{" "}
              or{" "}
              <Text
                type="TextHighlight"
                color="ButtonSecondary"
                onPress={onEmail}
              >
                Email
              </Text>
            </>
          ) : phone ? (
            <Text color="ButtonSecondary" type="TextHighlight" onPress={onCall}>
              Call Us
            </Text>
          ) : email ? (
            <Text
              type="TextHighlight"
              color="ButtonSecondary"
              onPress={onEmail}
            >
              Email Us
            </Text>
          ) : (
            <></>
          )}
        </Text>
      ) : null}
      {whatsappNumber || phone || email ? <Divider marginTop={16} /> : null}
    </>
  );
};

export default TripBookingScreen;
