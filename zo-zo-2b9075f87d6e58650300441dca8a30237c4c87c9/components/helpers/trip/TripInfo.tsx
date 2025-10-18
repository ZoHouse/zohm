import InfoSheet from "@/components/sheets/trips/InfoSheet";
import { Divider, Iconz, SectionTitle, Text } from "@/components/ui";
import DetailList from "@/components/ui/DetailList";
import { DetailRowProps } from "@/components/ui/DetailRow";
import { TripInfoItem, TripInventory, TripStop } from "@/definitions/trip";
import { makeTripsCancellationPolicyList } from "@/utils/trips";
import { Fragment, memo, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import TripItinerarySection from "./TripItinerary";
import { LocalMap } from "../stay-booking";
import helpers from "@/utils/styles/helpers";

type SectionContent =
  | { type: "detailList"; content: (DetailRowProps & { id: string })[] }
  | { type: "text"; content: string }
  | { type: "sheet"; content: null }
  | { type: "jsx"; content: React.ReactNode | null };

type Section = {
  title: string;
  subtitle?: string;
  includesMarker?: boolean;
  titleType: "Title" | "SectionTitle";
  onPress?: () => void;
} & SectionContent;

interface TripInfoProps {
  aboutSheet?: boolean;
  faqs: TripInfoItem[];
  highlights: TripInfoItem[];
  description: string;
  inclusions: TripInfoItem[];
  exclusions: TripInfoItem[];
  local_map: TripInventory["media"];
  guest_policies: TripInventory["guest_policies"];
  cancellation_policies: TripInventory["cancellation_policies"];
  essentials: TripInventory["essentials"];
  pickup_location: string;
  drop_location: string;
  destinations: TripInventory["destinations"];
  stops: TripStop[];
}

const sortByDay = (a: TripStop, b: TripStop) => a.day - b.day;

const toTripInfo = <T extends { icon: string; description: string }>(
  el: T,
  index: number
) =>
  ({
    id: `${index + 1}`,
    emoji: el.icon ?? "💡",
    label: el.description,
    gap: 8,
  } as DetailRowProps & { id: string });

const TripInfo = memo(
  ({
    aboutSheet = false,
    description,
    exclusions,
    faqs,
    highlights,
    inclusions,
    local_map,
    guest_policies,
    cancellation_policies,
    essentials,
    pickup_location,
    drop_location,
    destinations = [],
    stops,
  }: TripInfoProps) => {
    const tripHighlights = useMemo(() => {
      if (!highlights.length) return null;
      const _highlights = highlights?.map((el, index) => ({
        id: `${index + 1}`,
        emoji: el.icon ?? "💡",
        label: el.description,
        gap: 8,
      })) as DetailRowProps & { id: string }[];
      return _highlights;
    }, [highlights]);

    const _itinerary = useMemo(() => {
      return stops?.length ? (
        <View style={styles.itineraryContainer}>
          <TripItinerarySection itinerary={stops?.sort(sortByDay)} />
        </View>
      ) : null;
    }, [stops]);

    const localMap = useMemo(() => {
      if (!local_map?.length) return null;
      return <LocalMap images={local_map} hasDivider={false} />;
    }, [local_map]);

    const [sheet, setSheet] = useState<string | null>(null);

    const generalPolicy: DetailRowProps & { id: string }[] = useMemo(
      () => (guest_policies ?? [])?.map(toTripInfo),
      [guest_policies]
    );

    const descriptionSheet = useMemo(() => {
      return sheet === "description" ? (
        <InfoSheet
          isOpen={sheet === "description"}
          onClose={() => setSheet(null)}
          title="About Your Trip"
          list={[{ value: description }]}
        />
      ) : sheet === "policy" ? (
        <InfoSheet
          isOpen={sheet === "policy"}
          onClose={() => setSheet(null)}
          title="General Policy"
          list={[{ value: generalPolicy }]}
        />
      ) : sheet === "faqs" ? (
        <InfoSheet
          isOpen={sheet === "faqs"}
          onClose={() => setSheet(null)}
          title="FAQs"
          list={null}
          faqs={faqs}
        />
      ) : sheet === "cancellation" ? (
        <InfoSheet
          isOpen={sheet === "cancellation"}
          onClose={() => setSheet(null)}
          title="Cancellation Policy"
          list={makeTripsCancellationPolicyList(cancellation_policies)}
        />
      ) : null;
    }, [
      sheet,
      generalPolicy,
      description,
      generalPolicy,
      faqs,
      cancellation_policies,
    ]);

    const _essentials = useMemo(() => {
      if (!essentials?.length) return null;
      return essentials?.map(toTripInfo);
    }, [essentials]);

    const sections = useMemo(() => {
      let sectionsList: Section[] = [
        {
          title: "",
          titleType: "SectionTitle",
          type: "detailList",
          content: [],
        },
      ];

      if (
        pickup_location &&
        drop_location &&
        sectionsList[0].type === "detailList"
      ) {
        sectionsList[0].content.unshift({
          id: "1",
          emoji: "✈️",
          value: (
            <Text style={helpers.flex}>
              <Text type="TextHighlight">{pickup_location}</Text> →{" "}
              <Text type="TextHighlight">{drop_location}</Text>
            </Text>
          ),
          gap: 8,
        });
      }

      if (tripHighlights) {
        sectionsList.push({
          title: "Trip Higlights",
          titleType: "SectionTitle",
          type: "detailList",
          content: tripHighlights,
        });
      }

      if (_itinerary) {
        sectionsList.push({
          title: "What you'll do",
          titleType: "SectionTitle",
          type: "jsx",
          content: _itinerary,
        });
      }

      if (local_map?.length && destinations?.length) {
        sectionsList.push({
          title: `Experience ${destinations[0]?.name ?? ""}`,
          titleType: "SectionTitle",
          type: "jsx",
          content: localMap,
        });
      }

      if (description) {
        if (aboutSheet) {
          sectionsList.push({
            title: "About this trip",
            titleType: "SectionTitle",
            type: "sheet",
            content: null,
            onPress: () => setSheet("description"),
          });
        }
      }

      if (inclusions?.length) {
        sectionsList.push({
          title: "What's included",
          titleType: "SectionTitle",
          type: "detailList",
          content: inclusions?.map(toTripInfo),
        });
      }

      if (exclusions?.length) {
        sectionsList.push({
          title: "What's not included",
          titleType: "SectionTitle",
          type: "detailList",
          includesMarker: true,
          content: exclusions?.map(toTripInfo),
        });
      }

      if (_essentials?.length) {
        sectionsList.push({
          title: "Things to carry",
          titleType: "SectionTitle",
          type: "detailList",
          content: _essentials,
        });
      }

      if (guest_policies?.length) {
        sectionsList.push({
          title: "General Policy",
          titleType: "SectionTitle",
          type: "sheet",
          onPress: () => setSheet("policy"),
          content: null,
        });
      }

      if (cancellation_policies?.length) {
        sectionsList.push({
          title: "Cancellation Policy",
          titleType: "SectionTitle",
          type: "sheet",
          onPress: () => setSheet("cancellation"),
          content: null,
        });
      }

      if (faqs?.length) {
        sectionsList.push({
          title: "FAQs",
          titleType: "SectionTitle",
          type: "sheet",
          onPress: () => setSheet("faqs"),
          content: null,
        });
      }

      return sectionsList;
    }, [
      pickup_location,
      drop_location,
      tripHighlights,
      stops,
      local_map,
      localMap,
      destinations,
      description,
      aboutSheet,
      inclusions,
      exclusions,
      essentials,
      guest_policies,
      cancellation_policies,
      faqs,
    ]);

    return (
      <>
        {sections.map((el, index) => (
          <Fragment key={index}>
            {el.title ? (
              !el.includesMarker ? (
                <SectionTitle
                  type={el.titleType}
                  noHorizontalPadding
                  icon={el.onPress ? "rightAngle" : undefined}
                  onPress={el.onPress}
                >
                  {el.title}
                </SectionTitle>
              ) : (
                <View>
                  <SectionTitle
                    type={el.titleType}
                    noHorizontalPadding
                    icon={el.onPress ? "rightAngle" : undefined}
                    onPress={el.onPress}
                  >
                    {el.title}
                  </SectionTitle>
                  {el.includesMarker && (
                    <View style={styles.notCircle}>
                      <Iconz
                        name="not"
                        size={24}
                        style={styles.not}
                        fillTheme="Primary"
                        noFill
                      />
                    </View>
                  )}
                </View>
              )
            ) : null}
            {el.content && el.type === "detailList" && (
              <DetailList style={styles.gap} alignToTop data={el.content} />
            )}
            {index === 0 && description && !aboutSheet ? (
              <Text style={{ marginTop: 16 }}>{description}</Text>
            ) : null}
            {el.content && el.type === "text" && <Text>{el.content}</Text>}
            {el.content && el.type === "jsx" && el.content}
            {index !== sections.length - 1 && (
              <Divider marginTop={el.content ? 16 : 0} />
            )}
          </Fragment>
        ))}
        {descriptionSheet}
      </>
    );
  }
);

const styles = StyleSheet.create({
  notCircle: {
    position: "absolute",
    left: 64,
    top: 12,
  },
  not: { width: 42, height: 30 },
  itineraryContainer: {
    alignSelf: "stretch",
  },
  negativeHMargin: {
    marginHorizontal: -24,
  },
  highlightListContent: {
    paddingHorizontal: 24,
    gap: 8,
  },
  _mh: { marginHorizontal: -24 },
  mapList: {
    gap: 8,
    paddingHorizontal: 24,
  },
  highlightItem: {
    width: 180,
    height: 162,
    alignItems: "center",
    paddingTop: 36,
    // justifyContent: "center",
    gap: 16,
    padding: 16,
  },
  gap: {
    gap: 16,
  },
});

export default TripInfo;
