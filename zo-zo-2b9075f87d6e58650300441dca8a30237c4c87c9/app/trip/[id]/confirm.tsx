import { openRazorpay } from "@/components/helpers/misc/rzp";
import { Sheet } from "@/components/sheets";
import InfoSheet from "@/components/sheets/trips/InfoSheet";
import {
  AccordionItem,
  Button,
  CheckBox,
  DashedBorder,
  Divider,
  Iconz,
  Loader,
  Pressable,
  SafeAreaView,
  SectionTitle,
  SmallButton,
  Text,
  TextInput,
  View as Ziew,
} from "@/components/ui";
import AnimatedArrow from "@/components/ui/AnimatedArrow";
import DetailList from "@/components/ui/DetailList";
import ZoImage from "@/components/ui/ZoImage";
import { ZoCurrency } from "@/definitions/booking";
import { GeneralObject } from "@/definitions/general";
import {
  TripBooking,
  TripBookingRequest,
  ZoServerGuest,
} from "@/definitions/trip";
import useCredits from "@/hooks/useCredit";
import useMutation from "@/hooks/useMutation";
import useQuery from "@/hooks/useQuery";
import useTrips from "@/hooks/useTrips";
import useVisibilityState from "@/hooks/useVisibilityState";
import { triggerFeedBack } from "@/utils/haptics";
import { useReactiveRef, useToggleState } from "@/utils/hooks";
import Logger from "@/utils/logger";
import { logAxiosError } from "@/utils/network";
import { useTripStore } from "@/utils/store/trip";
import helpers from "@/utils/styles/helpers";
import { showToast } from "@/utils/toast";
import {
  getCurrenciedPrice,
  makeTripsCancellationPolicyList,
  withCurrency,
} from "@/utils/trips";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import axios from "axios";
import { router, useLocalSearchParams } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";
import moment from "moment";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeOutDown,
  FadeOutRight,
} from "react-native-reanimated";

const toCurrencyOrNull = (value: number, currency: ZoCurrency) =>
  value ? withCurrency(value, currency) : null;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    height: 56,
  },
  safeArea: {
    // ...helpers.stretch,
    // marginTop: 8,
  },
  dashedBorder: {
    marginVertical: 8,
  },
  checkRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 8,
    paddingBottom: 48,
  },
  button: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  flex: {
    flex: 1,
  },
  taxSheet: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 8,
  },
  taxDashedBorder: {
    marginTop: 24,
    marginBottom: 16,
  },
  taxBreakDown: {
    gap: 8,
    marginTop: 24,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    width: "100%",
  },
  creditRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  credit: {
    flex: 1,
    textAlign: "left",
  },
  emi: {
    marginTop: 16,
  },
  list: {
    gap: 16,
    padding: 24,
  },
  emiItem: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  emiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    alignItems: "center",
  },
  emiInfo: {
    width: "100%",
    gap: 8,
    paddingVertical: 8,
    paddingLeft: 64,
  },
  emiView: {
    flex: 1,
    alignSelf: "stretch",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  emiImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  underline: {
    textDecorationLine: "underline",
  },
  couponContainer: { marginBottom: -8 },
  couponBox: { overflow: "hidden" },
  couponIcon: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingRight: 8,
  },
  couponSuccess: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    backgroundColor: "#D3F4C8",
  },
  couponInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  couponErr: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    backgroundColor: "#FCDDDD",
  },
  couponIconPad: {
    paddingLeft: 8,
  },
  mv: {
    marginVertical: 24,
  },
  gap: {
    gap: 8,
  },
});

function calculateReducingInterest(
  principal: number,
  annualRatePercent: number,
  months: number
): { emi: number; totalRepayment: number; interest: number } {
  const monthlyRate = annualRatePercent / 12 / 100;

  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);

  const totalRepayment = emi * months;
  const interest = totalRepayment - principal;

  return {
    emi: parseFloat(emi.toFixed(2)),
    totalRepayment: parseFloat(totalRepayment.toFixed(2)),
    interest: parseFloat(interest.toFixed(2)),
  };
}

const EMIOptions = memo(
  ({
    formatCurrency,
    amount,
  }: {
    formatCurrency: (amount: number) => string | null;
    amount: number;
  }) => {
    const [isEMIOptionsOpen, showEMIOptions, hideEMIOptions] =
      useVisibilityState(false);

    const [emiOptions, setEmiOptions] = useState<GeneralObject | null>(null);

    const { data: isEmiViewDisabled = true } = useQuery(
      "AUTH_APPLICATION_SEED",
      {
        select: (data) =>
          data.data.disabled_features?.includes("trip_emi_view"),
      }
    );

    useEffect(() => {
      if (isEmiViewDisabled) {
        return;
      }
      const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID;
      const RAZORPAY_FID = process.env.EXPO_PUBLIC_RAZORPAY_FID;
      const url = `https://api.razorpay.com/v1/checkout/affordability?key_id=${RAZORPAY_KEY_ID}&amount=${amount}&razorpay_affordability_widget_fid=${RAZORPAY_FID}`;
      axios
        .get(url)
        .then((res) => res.data)
        .then(setEmiOptions)
        .catch(logAxiosError);
    }, [amount, isEmiViewDisabled]);

    const emiItems = useMemo(() => {
      if (!emiOptions) return [];
      return Object.entries(emiOptions?.entities?.emi?.items ?? {}) as [
        string,
        GeneralObject
      ][];
    }, [emiOptions]);

    const baseAmount = amount;

    const renderItem = useCallback(
      (item: [string, GeneralObject]) => (
        <EmiItem
          key={item[0]}
          name={item[0]}
          value={item[1]}
          baseAmount={baseAmount}
          emiOptions={emiOptions ?? {}}
          formatCurrency={formatCurrency}
        />
      ),
      [baseAmount, emiOptions]
    );

    if (isEmiViewDisabled) return null;
    if (!emiOptions) return null;

    return (
      <>
        <View style={styles.emi}>
          <Pressable onPress={showEMIOptions}>
            <Text type="SubtitleHighlight" color="ButtonSecondary">
              View EMI Options
            </Text>
          </Pressable>
        </View>
        {isEMIOptionsOpen ? (
          <Sheet
            isOpen={isEMIOptionsOpen}
            snapPoints={["80%"]}
            onDismiss={hideEMIOptions}
          >
            <SafeAreaView style={styles.flex} safeArea="bottom">
              <SectionTitle>EMI Options</SectionTitle>
              <BottomSheetScrollView
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
              >
                {emiItems.map(renderItem)}
              </BottomSheetScrollView>
            </SafeAreaView>
          </Sheet>
        ) : null}
      </>
    );
  }
);

const EmiItem = ({
  name,
  value,
  baseAmount,
  emiOptions,
  formatCurrency,
}: {
  name: string;
  value: GeneralObject;
  baseAmount: number;
  emiOptions: GeneralObject;
  formatCurrency: (amount: number) => string | null;
}) => {
  const getName = (key: string) => emiOptions?.mappings.banks[key];
  const img = name?.split("_")[0] ?? "";
  const bankName = getName(name) ?? "";
  const emiList = (
    value.values as {
      duration: number;
      interest: number;
      subvention: string;
      min_amount: number;
      merchant_payback: string;
    }[]
  ).sort((a, b) => a.duration - b.duration);
  const leastAmountEmi = emiList[emiList.length - 1];
  const { emi } = calculateReducingInterest(
    baseAmount,
    leastAmountEmi.interest,
    leastAmountEmi.duration
  );
  const roundedEmi = formatCurrency(Math.round(emi));
  const subtitle = roundedEmi ? `From ${roundedEmi}/month` : null;

  const [isShowing, toggle] = useToggleState(false);

  return (
    <View>
      <Pressable activeOpacity={0.8} style={styles.emiItem} onPress={toggle}>
        <Ziew background="Inputbox" style={styles.emiImage}>
          <ZoImage
            url={`https://cdn.razorpay.com/bank/${img}.gif`}
            width={null}
          />
        </Ziew>
        <View style={styles.emiView}>
          <Text>{bankName}</Text>
          {subtitle ? (
            <Text type="Subtitle" color="Secondary">
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View>
          <AnimatedArrow isDown={isShowing} />
        </View>
      </Pressable>
      <AccordionItem show={isShowing}>
        {isShowing ? (
          <View style={styles.emiInfo}>
            {emiList.map((emi) => {
              return (
                <EmiRow
                  formatCurrency={formatCurrency}
                  emi={emi}
                  key={emi.duration}
                  baseAmount={baseAmount}
                />
              );
            })}
          </View>
        ) : (
          <></>
        )}
      </AccordionItem>
    </View>
  );
};

const EmiRow = ({
  emi,
  baseAmount,
  formatCurrency,
}: {
  emi: {
    duration: number;
    interest: number;
    subvention: string;
    min_amount: number;
    merchant_payback: string;
  };
  baseAmount: number;
  formatCurrency: (amount: number) => string | null;
}) => {
  const { emi: emiAmount } = calculateReducingInterest(
    baseAmount,
    emi.interest,
    emi.duration
  );

  const emiString = formatCurrency(Math.round(emiAmount));

  return (
    <View style={styles.emiRow}>
      <Text type="Subtitle" style={styles.flex}>
        {emi.duration} EMIs @ {emi.interest}% pa
      </Text>
      {emiString ? (
        <Text type="SubtitleHighlight">{emiString}/month</Text>
      ) : null}
    </View>
  );
};

const Applied = memo(({ onClear }: { onClear: () => void }) => (
  <Animated.View
    entering={FadeInRight.springify()}
    exiting={FadeOutRight}
    key="applied"
    style={styles.couponInfoRow}
  >
    <View style={styles.couponSuccess}>
      <Text color="Success" type="Subtitle">
        😊 Applied
      </Text>
    </View>
    <Pressable
      activeOpacity={0.8}
      onPress={onClear}
      style={styles.couponIconPad}
    >
      <Iconz size={20} name="cross-circle" fillTheme="Primary" />
    </Pressable>
  </Animated.View>
));

const Invalid = memo(({ onClear }: { onClear: () => void }) => (
  <Animated.View
    entering={FadeInRight.springify()}
    exiting={FadeOutRight}
    key="invalid"
    style={styles.couponInfoRow}
  >
    <View style={styles.couponErr}>
      <Text color="Error" type="Subtitle">
        😕 Invalid
      </Text>
    </View>
    <Pressable
      activeOpacity={0.8}
      onPress={onClear}
      style={styles.couponIconPad}
    >
      <Iconz size={20} name="cross-circle" fillTheme="Primary" />
    </Pressable>
  </Animated.View>
));

const TripCoupon = memo(
  ({
    onApply,
    isApplied,
  }: {
    onApply: (couponCode: string) => Promise<void>;
    isApplied: boolean;
  }) => {
    const [isShowingCoupon, showCouponInput] = useVisibilityState(false);
    const [coupon, setCoupon] = useState<string>("");
    const couponRef = useReactiveRef(coupon);

    const [couponStatus, setCouponStatus] = useState<
      "loading" | "success" | "error" | null
    >(null);

    const { refetch: refetchValidity } = useQuery(
      "ZO_BOOKINGS_COUPON",
      {
        select: (data) => data.data,
        enabled: false,
        throwOnError: (er) => {
          logAxiosError(er);
          return false;
        },
      },
      {
        path: [coupon],
      }
    );

    const applyCoupon = useCallback(() => {
      if (coupon.length < 3) {
        return;
      }
      setCouponStatus("loading");
      refetchValidity()
        .then((res) => res.data)
        .then((data) => {
          const isApplicable =
            data?.status === "active" &&
            (data.applicable_before && data.applicable_after
              ? moment(data.applicable_before).isAfter(moment()) &&
                moment(data.applicable_after).isBefore(moment())
              : true);
          if (!isApplicable) {
            throw new Error("Coupon is not applicable");
          }
          return onApply(coupon);
        })
        .then(() => {
          setCouponStatus("success");
        })
        .catch((err) => {
          setCouponStatus("error");
          logAxiosError(err);
        });
    }, [coupon, onApply]);

    useEffect(() => {
      setCouponStatus(null);
    }, [coupon]);

    const onClear = useCallback(() => {
      setCoupon("");
      setCouponStatus(null);
      onApply("__clear__");
    }, [onApply]);

    return isShowingCoupon ? (
      <View style={styles.couponBox}>
        <TextInput
          placeholder="Enter Coupon Code"
          value={coupon}
          onChangeText={setCoupon}
          editable={!couponStatus}
          onSubmitEditing={applyCoupon}
        />
        <View style={styles.couponIcon}>
          {coupon && isApplied ? (
            <Applied onClear={onClear} />
          ) : coupon && couponStatus === "error" ? (
            <Invalid onClear={onClear} />
          ) : couponStatus === "loading" ? (
            <Animated.View
              key="loader"
              entering={FadeInRight.springify()}
              exiting={FadeOutRight}
            >
              <Loader />
            </Animated.View>
          ) : !isApplied && couponStatus === "success" ? (
            <Invalid onClear={onClear} />
          ) : coupon.length > 2 ? (
            <Animated.View
              entering={FadeInRight.springify()}
              exiting={FadeOutRight}
            >
              <SmallButton
                onPress={applyCoupon}
                disabled={!coupon}
                textStyle="SubtitleHighlight"
              >
                Apply
              </SmallButton>
            </Animated.View>
          ) : null}
        </View>
      </View>
    ) : (
      <Pressable onPress={showCouponInput}>
        <Text style={styles.underline}>Have coupon code?</Text>
      </Pressable>
    );
  }
);

const TaxBreakDownSheet = memo(
  ({
    isOpen,
    onClose,
    info,
  }: {
    isOpen: boolean;
    onClose: () => void;
    info: TripBooking;
  }) => {
    const { taxBreakDown, totalTax } = useMemo(() => {
      const denominator = 10 ** info.currency.decimals;
      const totalTax = toCurrencyOrNull(
        info.tax_amount / denominator,
        info.currency
      );

      const taxBreakDown: [string, string][] = [];
      let cgst = 0;
      let sgst = 0;
      let tcs = 0;
      info.booked_skus.forEach((sku) => {
        if (sku.tax_details.country_tax) {
          cgst += sku.tax_details.country_tax;
        }
        if (sku.tax_details.state_tax) {
          sgst += sku.tax_details.state_tax;
        }
        if (sku.tax_details.tcs) {
          tcs += sku.tax_details.tcs;
        }
      });

      cgst = cgst / denominator;
      sgst = sgst / denominator;
      tcs = tcs / denominator;

      if (cgst > 0) {
        taxBreakDown.push([
          "CGST",
          toCurrencyOrNull(cgst, info.currency) ?? "",
        ]);
      }
      if (sgst > 0) {
        taxBreakDown.push([
          "SGST",
          toCurrencyOrNull(sgst, info.currency) ?? "",
        ]);
      }
      if (tcs > 0) {
        taxBreakDown.push(["TCS", toCurrencyOrNull(tcs, info.currency) ?? ""]);
      }

      return { totalTax, taxBreakDown };
    }, [info]);

    return (
      <Sheet isOpen={isOpen} snapPoints={["50%"]} onDismiss={onClose}>
        <SafeAreaView safeArea="bottom" style={styles.taxSheet}>
          <Text center type="SectionTitle">
            Tax Breakdown
          </Text>
          <Divider marginTop={16} marginBottom={16} />
          <View style={styles.taxBreakDown}>
            {taxBreakDown.map(([name, amount]) => (
              <View style={styles.row} key={name}>
                <Text>{name}</Text>
                <Text>{amount}</Text>
              </View>
            ))}
          </View>
          <DashedBorder style={styles.taxDashedBorder} />
          <View style={styles.row}>
            <Text type="TextHighlight">Total Tax</Text>
            <Text>{totalTax}</Text>
          </View>
        </SafeAreaView>
      </Sheet>
    );
  }
);

const Confirm = () => {
  const {
    id,
    guests: _guests,
    date,
    sku,
  } = useLocalSearchParams<Record<string, string>>();
  const guestCount = useMemo(() => parseInt(_guests ?? "1") || 1, [_guests]);
  const { trip, wholePriceMap, duration, selectedItinerary, skuMap, addons } = useTrips(
    id,
    sku
  );
  const { state } = useTripStore();

  const [tcsDeclaration, toggleTcsDeclaration] = useToggleState(false);
  const [isCreditSelected, toggleIsCreditSelected] = useToggleState(false);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  const { credits } = useCredits(true);

  const { mutateAsync: bookTrip, isPending: isBookingLoading } =
    useMutation("BOOKINGS_TRIPS");
  const [isBookingProcessing, setIsBookingProcessing] = useState(false);
  const { mutateAsync: processOrder } = useMutation("PAYMENT_PROCESS_ORDER");
  const { mutateAsync: postPaymentResponse } = useMutation("PAYMENT_RESPONSE");
  const { mutateAsync: addCustomer } = useMutation<
    "ZO_BOOKINGS",
    ZoServerGuest,
    {}
  >("ZO_BOOKINGS");

  const addGuests = useCallback(
    (pid: string) => {
      state.guest.forEach((data) => {
        addCustomer(
          { ...data, path: `${pid}/customers/` },
          { onError: logAxiosError }
        );
      });
    },
    [state.guest, addCustomer]
  );

  const [info, setInfo] = useState<TripBooking>();

  const tcsPercentage = useMemo(() => {
    if (!info) return undefined;
    if (!info.booked_skus[0].tax_details.tcs_percent) return undefined;
    return info.booked_skus[0].tax_details.tcs_percent;
  }, [info]);

  const couponRef = useRef("");

  const generateInfo = useCallback(
    (couponCode: string | undefined = undefined) => {
      if (couponCode === "__clear__") {
        couponRef.current = "";
      } else if (couponCode) {
        couponRef.current = couponCode;
      }

      const data: TripBookingRequest = {
        sku,
        date,
        units: guestCount,
        addons: selectedAddons,
        tcs_declaration: tcsDeclaration,
        preview: true,
        coupon_code: couponRef.current,
      };

      return bookTrip(data)
        .then((data) => data.data)
        .then(setInfo)
        .catch(logAxiosError);
    },
    [selectedAddons, tcsDeclaration]
  );

  useEffect(() => {
    generateInfo();
  }, [generateInfo]);

  const hasLogged = useRef(false);
  useEffect(() => {
    if (hasLogged.current) return;
    if (!info) return;
    const name = trip?.name;
    const batch = selectedItinerary?.title;
    const value = info?.total_amount / Math.pow(10, info?.currency.decimals);
    if (!name || !batch || !value) return;
    hasLogged.current = true;
    Logger.tripBeginCheckout(batch, name, Number(value.toFixed(2)), guestCount);
  }, [info?.total_amount, trip, selectedItinerary?.title, guestCount]);

  const prices = useMemo(() => {
    if (!info) return null;
    const denominator = Math.pow(10, info.currency.decimals);
    const currency = info.currency;
    const perSku = info.booked_skus[0];

    const totalAmount = info.total_amount / denominator;
    const finalAmount = info.final_amount / denominator;
    const taxAmount = info.tax_amount / denominator;
    const advanceAmount = info.advance_amount / denominator;
    const dueAmount = info.due_amount / denominator;
    const perPersonAmount = perSku.price / denominator;
    const totalUnitsAmount = perPersonAmount * guestCount;
    const couponDiscountAmount = info.coupon_discount / denominator;

    const total = toCurrencyOrNull(totalAmount, currency);
    const final = toCurrencyOrNull(finalAmount, currency);
    const tax = toCurrencyOrNull(taxAmount, currency);
    const advance = toCurrencyOrNull(advanceAmount, currency);
    const due = toCurrencyOrNull(dueAmount, currency);
    const perPerson = toCurrencyOrNull(perPersonAmount, currency);
    const totalUnitsPrice = toCurrencyOrNull(totalUnitsAmount, currency);
    const couponDiscount = toCurrencyOrNull(couponDiscountAmount, currency);
    const couponCode = info.coupon;

    const taxLabelList: string[] = [];
    if (perSku.tax_details.tcs_percent) {
      taxLabelList.push(`TCS ${perSku.tax_details.tcs_percent}%`);
    }
    if (perSku.tax_details.country_tax_percent) {
      taxLabelList.push(`CGST ${perSku.tax_details.country_tax_percent}%`);
    }
    if (perSku.tax_details.state_tax_percent) {
      taxLabelList.push(`SGST ${perSku.tax_details.state_tax_percent}%`);
    }

    let taxLabel = taxLabelList.join(" + ");
    if (taxLabelList.length > 1) {
      taxLabel = `(${taxLabel})`;
    }

    return {
      total,
      final,
      tax,
      advance,
      due,
      perPerson,
      totalAmount,
      finalAmount,
      taxAmount,
      advanceAmount,
      dueAmount,
      couponDiscount,
      couponCode,
      tcsDeclaration,
      taxLabel,
      totalUnitsPrice,
    };
  }, [info, tcsDeclaration]);

  const [startDate, endDate] = useMemo(() => {
    return [
      moment(date).format("DD MMM"),
      moment(date)
        .add(duration - 1, "day")
        .format("DD MMM"),
    ];
  }, [date, duration]);

  const [
    isCancellationPolicyOpen,
    showCancellationPolicy,
    hideCancellationPolicy,
  ] = useVisibilityState(false);

  const toggleAddon = useCallback((id: string) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((el) => el !== id) : [...prev, id]
    );
  }, []);

  const openCancellationPolicy = useCallback(() => {
    triggerFeedBack("Soft");
    showCancellationPolicy();
  }, []);

  const tripAddons = useMemo(
    () =>
      addons
        ?.filter((addon) => addon.prices.some((price) => price.date === date))
        .map((addon) => ({
          ...addon,
          prices: addon.prices.filter((price) => price.date === date),
        })) ?? [],
    [addons?.length]
  );

  const addonsSection = useMemo(
    () =>
      tripAddons.length ? (
        <>
          <Divider marginTop={16} />
          <SectionTitle noHorizontalPadding>Add-Ons</SectionTitle>
          {tripAddons.map((el) => (
            <Pressable
              style={styles.row}
              key={el.id}
              activeOpacity={0.8}
              onPress={() => toggleAddon(el.id)}
            >
              <View style={styles.flex}>
                <Text>
                  {el.name}{" "}
                  <Text type="TextHighlight">
                    {getCurrenciedPrice(
                      el.prices[0].price,
                      el.prices[0].currency,
                      1
                    )}
                  </Text>
                </Text>
                {el.description ? (
                  <Text type="Tertiary" color="Secondary">
                    {el.description}
                  </Text>
                ) : (
                  <></>
                )}
              </View>
              <CheckBox size={20} isSelected={selectedAddons.includes(el.id)} />
            </Pressable>
          ))}
        </>
      ) : null,
    [tripAddons.length, selectedAddons, toggleAddon]
  );

  const addonsBreakdown = useMemo(() => {
    if (!info) return null;
    const addons = info?.booked_skus[0]?.booked_addons;
    if (!addons) return null;
    if (addons.length === 0) return null;

    return addons.map((addon) => (
      <View style={styles.row} key={addon.addon_id}>
        <Text style={styles.flex}>
          {addon.name} X {guestCount}
          {guestCount === 1 ? " Guest" : " Guests"}
        </Text>
        <Text>
          {getCurrenciedPrice(addon.price, info.currency, guestCount)}
        </Text>
      </View>
    ));
  }, [info]);

  const [isTaxBreakDownOpen, showTaxBreakDown, hideTaxBreakDown] =
    useVisibilityState(false);

  const couponSection = useMemo(
    () =>
      info ? (
        <>
          <Divider marginTop={16} marginBottom={8} />
          <View style={styles.couponContainer}>
            <TripCoupon onApply={generateInfo} isApplied={!!info?.coupon} />
          </View>
        </>
      ) : null,
    [generateInfo, info]
  );

  const formatCurrency = useCallback(
    (amount: number) => {
      if (!trip?.currency) {
        return null;
      }
      return toCurrencyOrNull(amount, trip.currency);
    },
    [trip?.currency]
  );

  const onPay = useCallback(() => {
    const data: TripBookingRequest = {
      sku,
      date,
      units: guestCount,
      addons: selectedAddons,
      tcs_declaration: tcsDeclaration,
      coupon_code: couponRef.current,
    };
    if (isCreditSelected && credits?.balance) {
      data.credits_to_spend = credits.balance;
    }

    setIsBookingProcessing(true);
    bookTrip(data)
      .then((data) => data.data)
      .then(({ pid, payments }) => {
        addGuests(pid);
        return { payments, pid };
      })
      .then(({ pid, payments }) => {
        const requiredPayment = payments.find(
          (p) => p.payment_mode === "gateway"
        );
        const creditPayment = payments.find(
          (p) => p.payment_mode === "credits"
        );
        if (requiredPayment) {
          return processOrder(requiredPayment)
            .then((res) =>
              res.status === 201
                ? openRazorpay(res.data, undefined, undefined, "zo")
                : Promise.reject("Payment Process Error")
            )
            .then((res) => postPaymentResponse(res))
            .then(() => pid);
        } else if (creditPayment) {
          router.push(`/trip/booking/${pid}?from_payment=true`);
        } else {
          return Promise.reject(new Error("Try again later"));
        }
      })
      .then((pid) => {
        if (pid) {
          router.push(`/trip/booking/${pid}?from_payment=true`);
        }
      })
      .catch((er) => {
        logAxiosError(er);
        showToast({
          message: "Something went wrong, please try again later",
          type: "error",
        });
      })
      .finally(() => {
        setIsBookingProcessing(false);
      });
  }, [
    info,
    processOrder,
    isCreditSelected,
    credits,
    selectedAddons,
    tcsDeclaration,
  ]);

  const details = useMemo(() => {
    if (!trip || !selectedItinerary || !skuMap) return null;
    const batch = skuMap[sku].name;
    return (
      <DetailList
        gap={12}
        style={{ gap: 16 }}
        data={[
          {
            id: "1",
            emoji: "🎒",
            value: (
              <Text style={styles.flex} type="TextHighlight">
                {trip.name}: {selectedItinerary.title}
              </Text>
            ),
          },
          {
            id: "group",
            emoji: "🧑‍🤝‍🧑",
            value: (
              <Text style={styles.flex}>
                Group: <Text type="TextHighlight">{batch}</Text>
              </Text>
            ),
          },
          {
            id: "2",
            emoji: "🛫",
            value: (
              <Text style={styles.flex}>
                Starts at{" "}
                <Text type="TextHighlight" style={styles.flex}>
                  {selectedItinerary?.pickup_location}
                </Text>{" "}
                → Ends at{" "}
                <Text type="TextHighlight">
                  {selectedItinerary?.drop_location}
                </Text>
              </Text>
            ),
          },
          {
            id: "3",
            emoji: "🗓",
            value: (
              <Text style={styles.flex}>
                <Text type="TextHighlight">{startDate}</Text> →{" "}
                <Text type="TextHighlight">{endDate}</Text> • {duration} day
                {duration > 1 ? "s" : ""}
              </Text>
            ),
          },
          {
            id: "4",
            emoji: "👥",
            value: (
              <Text style={styles.flex}>
                {guestCount} guest
                {guestCount === 1 ? "" : "s"}
              </Text>
            ),
          },
        ]}
      />
    );
  }, [
    guestCount,
    startDate,
    endDate,
    duration,
    selectedItinerary,
    trip,
    skuMap,
  ]);

  if (!trip || !wholePriceMap) {
    return (
      <Ziew background style={helpers.stretch}>
        <SafeAreaView safeArea="top" style={styles.safeArea} />
        <View style={styles.header}>
          <Iconz
            name="arrow-left"
            size={24}
            fillTheme="Primary"
            onPress={goBack}
          />
        </View>
        <SectionTitle type="Title">Confirm & Pay</SectionTitle>
        <View style={helpers.flexLoader}>
          <Loader />
        </View>
      </Ziew>
    );
  }

  return (
    <Ziew background style={helpers.stretch}>
      <SafeAreaView safeArea="top" style={styles.safeArea} />
      <View style={styles.header}>
        <Iconz
          name="arrow-left"
          size={24}
          fillTheme="Primary"
          onPress={goBack}
        />
      </View>
      <SectionTitle type="Title">Confirm & Pay</SectionTitle>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        {details}
        {addonsSection}
        {couponSection}
        <Divider marginTop={16} />
        {!info ? (
          <Animated.View
            style={styles.mv}
            key="loader"
            entering={FadeInDown}
            exiting={FadeOutDown}
          >
            <Loader />
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeInDown}
            exiting={FadeOutDown}
            key="info"
            style={styles.gap}
          >
            <SectionTitle noHorizontalPadding>Payment Info</SectionTitle>
            <View style={styles.row}>
              <Text style={styles.flex}>
                {prices?.perPerson} X{" "}
                {guestCount === 1 ? "1 Guest" : `${guestCount} Guests`}
              </Text>
              <Text>{prices?.totalUnitsPrice}</Text>
            </View>
            {addonsBreakdown}
            {prices?.couponDiscount ? (
              <View style={styles.row}>
                <Text style={styles.flex}>
                  {prices.couponCode ? `${prices.couponCode + " "} ` : ""}
                  Discount
                </Text>
                <Text>- {prices.couponDiscount}</Text>
              </View>
            ) : (
              <></>
            )}
            {prices?.tax ? (
              <>
                <View style={styles.row}>
                  <Text style={styles.flex}>
                    Tax{" "}
                    {prices.taxLabel ? (
                      <Text type="Tertiary">{prices.taxLabel}</Text>
                    ) : null}
                  </Text>
                  <Text>{prices?.tax}</Text>
                </View>
                {trip.is_international ? (
                  <Pressable
                    activeOpacity={0.8}
                    style={styles.checkRow}
                    onPress={toggleTcsDeclaration}
                  >
                    <CheckBox isSelected={tcsDeclaration} size={18} />
                    <Text type="Subtitle" style={styles.flex}>
                      I confirm that my international trip expenses for this
                      financial year are over ₹10 Lakhs. This will reflect as
                      TCS tax in your prices above.
                    </Text>
                  </Pressable>
                ) : (
                  <></>
                )}
                <Pressable onPress={showTaxBreakDown}>
                  <Text type="SmallButton" color="ButtonSecondary">
                    View Tax Breakdown
                  </Text>
                </Pressable>
              </>
            ) : (
              <></>
            )}
            <View style={styles.dashedBorder}>
              <DashedBorder />
            </View>
            <View style={styles.row}>
              <Text type="TextHighlight">Trip Total</Text>
              <Text type="TextHighlight">{prices?.total}</Text>
            </View>
            <Divider marginBottom={32} marginTop={8} />
            <Text type="Subtitle">
              By booking, you agree to our{" "}
              <Text
                type="SubtitleHighlight"
                color="ButtonSecondary"
                onPress={openCancellationPolicy}
              >
                Cancellation Policy
              </Text>
            </Text>
            {trip.is_international && tcsPercentage && (
              <Text type="Subtitle">
                I understand that {tcsPercentage}% TCS (Tax Collected as Source)
                will be applied to this booking & can be claimed while filing IT
                returns.
              </Text>
            )}
            {credits && Number(credits.balance) > 0 && (
              <Pressable
                style={styles.creditRow}
                onPress={toggleIsCreditSelected}
                activeOpacity={0.8}
              >
                <CheckBox size={16} isSelected={isCreditSelected} />
                <Text type="Subtitle" style={styles.credit}>
                  Use Zo Credits {credits.value}
                </Text>
              </Pressable>
            )}
            {prices?.totalAmount && prices.totalAmount > 0 ? (
              <EMIOptions
                formatCurrency={formatCurrency}
                amount={Math.round(prices.totalAmount)}
              />
            ) : null}
          </Animated.View>
        )}
      </ScrollView>
      {prices?.dueAmount && prices.dueAmount > 0 && prices.due ? (
        <View style={styles.button}>
          <Button
            onPress={onPay}
            isLoading={isBookingLoading || isBookingProcessing}
          >
            Pay {prices.due}
          </Button>
          <SafeAreaView safeArea="bottom" />
        </View>
      ) : (
        <></>
      )}
      {info && isTaxBreakDownOpen && (
        <TaxBreakDownSheet
          isOpen={isTaxBreakDownOpen}
          onClose={hideTaxBreakDown}
          info={info}
        />
      )}
      {isCancellationPolicyOpen && (
        <InfoSheet
          isOpen={isCancellationPolicyOpen}
          onClose={hideCancellationPolicy}
          title="Cancellation Policy"
          list={makeTripsCancellationPolicyList(
            trip.cancellation_policies ?? []
          )}
        />
      )}
    </Ziew>
  );
};

export default Confirm;

const req = {
  amount: 4829999999999,
  client_name: "BOOKING",
  client_reference_id: "5c969a35-8444-4125-9ab1-572675d498fa",
  currency: "INR",
  email: "zyxw@zo.xyz",
  first_name: "FN",
  hash: "eb04add11e877c44f0636f4ee7905a4f327a7a8ab271e6c672b1aa8545e81434",
  intent: "collect",
  last_name: "LN",
  merchant: "ZOSTEL",
  mobile: "919879879879",
  operator_code: "H8JR6VVQ",
  order_description: "5RHJ9XM6",
  payment_mode: "gateway",
  product_id: "5RHJ9XM6",
  status: "in-progress",
};
