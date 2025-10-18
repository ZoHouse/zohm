import { FilterValue } from "@/definitions/trip";
import Sheet from "../Base";
import useQuery from "@/hooks/useQuery";
import { logAxiosError } from "@/utils/network";
import { memo, useCallback, useMemo, useState } from "react";
import { useToggleState } from "@/utils/hooks";
import { StyleSheet, View } from "react-native";
import {
  CheckBox,
  Chip,
  Divider,
  Pressable,
  SafeAreaView,
  SectionTitle,
  SmallButton,
  Text,
} from "@/components/ui";
import { divideAlternate } from "@/utils/data-types/list";
import Ziew from "@/components/ui/View";
import { useThemeColors } from "@/context/ThemeContext";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import helpers from "@/utils/styles/helpers";
import DoubleSlider from "@/components/ui/DoubleSlider";

type PriceRange = { value: number; position: number } | null;
interface TripFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: FilterValue[];
  setSelectedMonth: (value: FilterValue[]) => void;
  from: FilterValue[];
  setFrom: (value: FilterValue[]) => void;
  minPrice: PriceRange;
  setMinPrice: (value: PriceRange) => void;
  maxPrice: PriceRange;
  setMaxPrice: (value: PriceRange) => void;
  mainTags: FilterValue[];
  allTags: FilterValue[];
  selectedTags: FilterValue[];
  setSelectedTags: (value: FilterValue[]) => void;
}

const months = [
  { name: "January", code: "1" },
  { name: "February", code: "2" },
  { name: "March", code: "3" },
  { name: "April", code: "4" },
  { name: "May", code: "5" },
  { name: "June", code: "6" },
  { name: "July", code: "7" },
  { name: "August", code: "8" },
  { name: "September", code: "9" },
  { name: "October", code: "10" },
  { name: "November", code: "11" },
  { name: "December", code: "12" },
];

const TripFilterSheet = ({
  isOpen,
  onClose,
  selectedTags: selectedTagsProp,
  setSelectedTags: setSelectedTagsProp,
  mainTags,
  allTags,
  selectedMonth: selectedMonthProp,
  setSelectedMonth: setSelectedMonthProp,
  from: fromProp,
  setFrom: setFromProp,
  minPrice: minPriceProp,
  setMinPrice: setMinPriceProp,
  maxPrice: maxPriceProp,
  setMaxPrice: setMaxPriceProp,
}: TripFilterSheetProps) => {
  const { data: destinations = [] } = useQuery<
    "BOOKINGS_TRIP",
    { results: FilterValue[] },
    FilterValue[]
  >(
    "BOOKINGS_TRIP",
    {
      select: (data) => data.data?.results,
      throwOnError: (er) => {
        logAxiosError(er);
        return false;
      },
      staleTime: Infinity,
    },
    {
      path: ["inventory", "destinations"],
    }
  );

  const [selectedMonth, setSelectedMonth] =
    useState<FilterValue[]>(selectedMonthProp);
  const [from, setFrom] = useState<FilterValue[]>(fromProp);
  const [selectedTags, setSelectedTags] =
    useState<FilterValue[]>(selectedTagsProp);

  const [isShowMoreFrom, toggleShowMoreFrom] = useToggleState(false);

  const fromDestinations = useMemo(() => {
    return destinations.slice(0, isShowMoreFrom ? destinations.length : 10);
  }, [destinations, isShowMoreFrom]);

  const [minPrice, setMinPrice] = useState(minPriceProp);
  const [maxPrice, setMaxPrice] = useState(maxPriceProp);

  const onApply = useCallback(() => {
    setSelectedTagsProp(selectedTags);
    setSelectedMonthProp(selectedMonth);
    setFromProp(from);
    setMinPriceProp(minPrice);
    setMaxPriceProp(maxPrice);
    onClose();
  }, [selectedMonth, from, minPrice, maxPrice, selectedTags]);

  const onClear = useCallback(() => {
    setSelectedTagsProp([]);
    setSelectedMonthProp([]);
    setFromProp([]);
    setMinPriceProp(null);
    setMaxPriceProp(null);
    onClose();
  }, []);

  const [bg] = useThemeColors(["Background.Sheet"]);

  const headStyle = useMemo(
    () => [styles.title, { backgroundColor: bg }],
    [bg]
  );

  return (
    <Sheet isOpen={isOpen} onDismiss={onClose} snapPoints={["90%"]}>
      <View style={headStyle}>
        <SectionTitle>All Filters</SectionTitle>
      </View>
      <BottomSheetScrollView
        showsVerticalScrollIndicator={false}
        style={helpers.flex}
        contentContainerStyle={styles.list}
      >
        <View style={styles.gap}>
          <Text type="SubtitleHighlight">Trip Type</Text>
          <ChipSelection
            selectedValues={selectedTags}
            onSelect={setSelectedTags}
            values={mainTags}
          />
        </View>
        <Divider />
        <View style={styles.gap}>
          <Text type="SubtitleHighlight">Month</Text>
          <ChipSelection
            selectedValues={selectedMonth}
            onSelect={setSelectedMonth}
            values={months}
          />
        </View>
        <Divider />
        <View style={styles.gap}>
          <Text type="SubtitleHighlight">Destinations</Text>
          <CheckSelection
            selectedValues={from}
            onSelect={setFrom}
            values={fromDestinations}
          />
          <Pressable
            activeOpacity={0.8}
            onPress={toggleShowMoreFrom}
            style={styles.ph}
          >
            <Text color="ButtonSecondary" type="SubtitleHighlight">
              {isShowMoreFrom ? "Show Less" : "Show More"}
            </Text>
          </Pressable>
        </View>
        <Divider />
        <View style={styles.gap}>
          <Text type="SubtitleHighlight">Price Range</Text>
          <DoubleSlider
            leftValue={minPrice}
            rightValue={maxPrice}
            setLeftValue={setMinPrice}
            setRightValue={setMaxPrice}
          />
        </View>
        <Divider />
        <View style={styles.gap}>
          <Text type="SubtitleHighlight">Theme</Text>
          <ChipSelection
            selectedValues={selectedTags}
            onSelect={setSelectedTags}
            values={allTags}
          />
        </View>
      </BottomSheetScrollView>
      <Ziew background="Sheet" style={styles.foot}>
        <SafeAreaView safeArea="bottom" style={styles.safeFoot}>
          <Pressable onPress={onClear}>
            <Text type="SubtitleHighlight">Clear All</Text>
          </Pressable>
          <SmallButton onPress={onApply}>Show Trips</SmallButton>
        </SafeAreaView>
      </Ziew>
    </Sheet>
  );
};

interface ChipSelectionProps {
  values: FilterValue[];
  selectedValues: FilterValue[];
  onSelect: React.Dispatch<React.SetStateAction<FilterValue[]>>;
}

const ChipSelection = memo(
  ({ values, selectedValues, onSelect }: ChipSelectionProps) => {
    const onToggle = useCallback(
      (value: FilterValue) => {
        onSelect((values) =>
          values.find((v) => v.code === value.code) !== undefined
            ? values.filter((v) => v.code !== value.code)
            : [...values, value]
        );
      },
      [onSelect]
    );

    return (
      <View style={styles.chipRow}>
        {values.map((value) => (
          <FilterChip
            key={value.code}
            value={value}
            isSelected={
              selectedValues.find((v) => v.code === value.code) !== undefined
            }
            onPress={onToggle}
          />
        ))}
      </View>
    );
  }
);

const FilterChip = ({
  value,
  isSelected,
  onPress,
}: {
  value: FilterValue;
  isSelected: boolean;
  onPress: (value: FilterValue) => void;
}) => {
  return (
    <Pressable onPress={() => onPress(value)}>
      <Chip
        stroke={isSelected ? "Selected" : "NonSelected"}
        curve={100}
        style={styles.chip}
      >
        <Text type="TertiaryHighlight">{value.name}</Text>
      </Chip>
    </Pressable>
  );
};

interface CheckSelectionProps {
  values: FilterValue[];
  selectedValues: FilterValue[];
  onSelect: React.Dispatch<React.SetStateAction<FilterValue[]>>;
}

const CheckSelection = memo(
  ({ values, selectedValues, onSelect }: CheckSelectionProps) => {
    const [left, right] = useMemo(() => divideAlternate(values), [values]);

    const onToggle = useCallback(
      (value: FilterValue) => {
        onSelect((values) =>
          values.find((v) => v.code === value.code) !== undefined
            ? values.filter((v) => v.code !== value.code)
            : [...values, value]
        );
      },
      [onSelect]
    );

    return (
      <View style={styles.destinationRow}>
        <View style={styles.half}>
          {left.map((value) => (
            <CheckRow
              key={value.code}
              value={value}
              isSelected={
                selectedValues.find((v) => v.code === value.code) !== undefined
              }
              onPress={onToggle}
            />
          ))}
        </View>
        <View style={styles.half}>
          {right.map((value) => (
            <CheckRow
              key={value.code}
              value={value}
              isSelected={
                selectedValues.find((v) => v.code === value.code) !== undefined
              }
              onPress={onToggle}
            />
          ))}
        </View>
      </View>
    );
  }
);

interface CheckRowProps {
  value: FilterValue;
  isSelected: boolean;
  onPress: (value: FilterValue) => void;
}

const CheckRow = ({ value, isSelected, onPress }: CheckRowProps) => {
  return (
    <Pressable onPress={() => onPress(value)} style={styles.checkRow}>
      <CheckBox circle={false} isSelected={isSelected} size={16} />
      <Text style={styles.flex} numberOfLines={1} type="Subtitle">
        {value.name}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
    minHeight: 32,
    width: "100%",
  },
  half: { width: "50%" },
  destinationRow: { flexDirection: "row", gap: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    height: 36,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    shadowColor: "black",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  list: {
    paddingHorizontal: 24,
    gap: 12,
    paddingTop: 16,
    paddingBottom: 24,
  },
  gap: { gap: 16 },
  foot: {
    shadowColor: "black",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  safeFoot: {
    padding: 24,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
  },
  ph: { paddingHorizontal: 24 },
});

export default TripFilterSheet;
