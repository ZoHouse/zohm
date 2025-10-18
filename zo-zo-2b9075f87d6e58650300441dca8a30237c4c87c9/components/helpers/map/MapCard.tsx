import { useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import moment from "moment";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import colors from "@/config/colors.json";
import constants from "@/utils/constants";
import helpers from "@/utils/styles/helpers";
import { getMapURLType } from "@/utils/map";
import { joinArrayOfStringsTillLimit } from "@/utils/data-types/string";
import { formatDateForServer } from "@/utils/data-types/date";
import { checkIfSoldOut, minPrice } from "@/utils/stay";
import { getCurrenciedPrice } from "@/utils/trips";
import { MapOperator } from "@/definitions/zo";
import { useThemeColors } from "@/context/ThemeContext";
import useQuery from "@/hooks/useQuery";
import { useBooking } from "@/context/BookingContext";
import { useCurrency } from "@/context/CurrencyContext";
import { Iconz, Pressable, Text } from "@/components/ui";
import ZoImage from "@/components/ui/ZoImage";

interface MapCard {
  operator: MapOperator;
  hideLogo?: boolean;
  onPrePress?: () => void;
}

const MapCardView: React.FC<MapCard> = ({ operator, hideLogo = false, onPrePress }) => {
  const [primary] = useThemeColors(["Vibes.Dark"]);
  const [gradientBottom] = useMemo(
    () => [
      [
        `${primary}00`,
        `${primary}00`,
        `${primary}00`,
        `${primary}CC`,
        primary,
      ] as const,
    ],
    [primary]
  );

  enum StayInfoCardType {
    price = "p",
    soldOut = "s",
  }

  const [source, text] = useMemo(() => {
    const urlType = getMapURLType(operator.type_code, operator.operating_model);
    const source = { uri: constants.map.urls[urlType] };
    const text = urlType.replace("-", " ");
    return [source, text];
  }, [operator]);

  const { startDate, endDate } = useBooking();

  const isTrip = useMemo(() => operator.type === "zo-trip", [operator.type]);

  const { data: stayInfo } = useQuery(
    "STAY_AVAILABILITY",
    {
      enabled: !isTrip,
      select: (data) => {
        const isSoldOut = checkIfSoldOut(data.data.availability);
        if (!isSoldOut) {
          const price = minPrice(data.data.pricing);
          return { type: StayInfoCardType.price, price } as const;
        } else {
          return { type: StayInfoCardType.soldOut } as const;
        }
      },
    },
    {
      search: {
        checkin: formatDateForServer(startDate),
        checkout: formatDateForServer(endDate),
        property_code: operator.code,
      },
    }
  );
  const { formatCurrency } = useCurrency();

  const [batchString, tripPrice] = useMemo(() => {
    if (!operator.batches?.length) {
      return ["Sold Out", null];
    }
    return [
      joinArrayOfStringsTillLimit(
        operator.batches?.map((b) => moment(b).format("DD MMM")) || [],
        2
      ),
      operator.price && operator.currency
        ? getCurrenciedPrice(operator.price, operator.currency, 1, 0)
        : null,
    ];
  }, [operator]);

  const onPress = useCallback(() => {
    onPrePress?.();
    if (isTrip) {
      router.push(`/trip/${operator.code}`);
    } else {
      router.push(`/property/${operator.code}`);
    }
  }, [isTrip, operator.code, onPrePress]);

  return (
    <Pressable activeOpacity={0.9} onPress={onPress} style={styles.card}>
      <View style={helpers.absoluteFit}>
        <ZoImage url={operator.image} width="m" />
      </View>
      <LinearGradient style={helpers.absoluteFit} colors={gradientBottom} />
      <View style={helpers.absoluteFit}>
        <View style={helpers.flex} />
        <View style={styles.cardContent}>
          <View style={helpers.flex}>
            <Text color="Light" type="TextHighlight">
              {operator.name}
            </Text>
            {stayInfo ? (
              stayInfo.type === StayInfoCardType.price ? (
                <Text style={styles.light} type="Subtitle">
                  Starting from{" "}
                  <Text color="Light" type="SubtitleHighlight">
                    {formatCurrency(stayInfo.price)}
                  </Text>
                </Text>
              ) : (
                <Text style={styles.light} type="Subtitle">
                  Sold Out
                </Text>
              )
            ) : isTrip && batchString ? (
              <Text style={styles.light} type="Subtitle">
                {batchString}
              </Text>
            ) : null}
            {tripPrice ? (
              <Text style={styles.light} type="Tertiary">
                From{" "}
                <Text color="Light" type="TertiaryHighlight">
                  {tripPrice}
                </Text>
                /person
              </Text>
            ) : null}
          </View>
          <Iconz name="arrow-right" size={24} theme="Text.Light" />
        </View>
      </View>
      {hideLogo ? null : (
        <View style={styles.cardIcon}>
          <Text type="TextHighlight" color="Dark" style={styles.cardText}>
            {text}
          </Text>
          <Image
            source={source}
            cachePolicy="disk"
            contentFit="contain"
            style={styles.icon}
          />
        </View>
      )}
    </Pressable>
  );
};

export default MapCardView;

const styles = StyleSheet.create({
  card: {
    width: constants.map.cardWidth,
    height: constants.map.cardHeight,
    borderRadius: 16,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  cardContent: {
    padding: 24,
    gap: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  icon: {
    width: 48,
    height: 48,
    position: "absolute",
    left: -24,
    top: -4,
  },
  cardIcon: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingVertical: 6,
    paddingLeft: 28,
    paddingRight: 16,
    backgroundColor: "white",
    borderTopRightRadius: 100,
    borderBottomRightRadius: 100,
    borderCurve: "continuous",
  },
  cardText: {
    textTransform: "capitalize",
  },
  light: {
    color: colors.dark.Text.Secondary,
  },
});
