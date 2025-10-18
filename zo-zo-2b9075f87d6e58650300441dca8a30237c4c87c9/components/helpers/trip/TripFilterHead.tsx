import { Chip, Iconz, Pressable, Text } from "@/components/ui";
import { FilterValue } from "@/definitions/trip";
import { Dispatch, memo, SetStateAction, useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Ziew from "@/components/ui/View";

const FilterHead = ({
  monthFilters,
  selectedMonth,
  setSelectedMonth,
  tags,
  selectedTags,
  setSelectedTags,
  selectedSort,
  openSortSheet,
  showFilterSheet,
}: {
  monthFilters: FilterValue[];
  selectedMonth: FilterValue[];
  selectedSort: FilterValue | null;
  tags: FilterValue[];
  selectedTags: FilterValue[];
  setSelectedTags: Dispatch<SetStateAction<FilterValue[]>>;
  showFilterSheet: () => void;
  setSelectedMonth: Dispatch<SetStateAction<FilterValue[]>>;
  openSortSheet: () => void;
}) => {
  const list = useMemo(() => {
    const result: (FilterValue & {
      isSelected: boolean;
      onPress: () => void;
    })[] = [];
    result.push({
      name: "Sort By",
      code: "__sort",
      isSelected: selectedSort !== null,
      onPress: openSortSheet,
    });
    tags?.forEach((t) => {
      const isSelected =
        selectedTags.find((tag) => tag.code === t.code) !== undefined;
      const onPress = () =>
        setSelectedTags((prev) =>
          isSelected ? prev.filter((tag) => tag.code !== t.code) : [...prev, t]
        );
      result.push({
        name: t.name,
        code: t.code,
        isSelected,
        onPress,
      });
    });
    monthFilters.forEach((f) => {
      const isSelected =
        selectedMonth.find((t) => t.code === f.code) !== undefined;
      const onPress = () =>
        setSelectedMonth((prev) =>
          isSelected ? prev.filter((t) => t.code !== f.code) : [...prev, f]
        );
      result.push({
        ...f,
        isSelected,
        onPress,
      });
    });
    return result;
  }, [monthFilters, selectedMonth, selectedSort, tags, selectedTags]);

  return (
    <Ziew background style={styles.container}>
      <View style={styles.filterButtonContainer}>
        <FilterButton onPress={showFilterSheet} filter="__filter" isSelected />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {list.map((f) => (
          <FilterButton
            onPress={f.onPress}
            key={f.code}
            filter={f.name}
            isSelected={f.isSelected}
          />
        ))}
      </ScrollView>
    </Ziew>
  );
};

const FilterButton = ({
  filter,
  onPress,
  isSelected,
}: {
  filter: string;
  onPress: () => void;
  isSelected: boolean;
}) => {
  const filterStyle = useMemo(
    () => [
      styles.filterView,
      {
        marginRight: filter === "__filter" ? 4 : 0,
      },
    ],
    [filter]
  );

  return (
    <Pressable activeOpacity={0.8} onPress={onPress}>
      <Chip
        stroke={!isSelected ? "NonSelected" : "Selected"}
        curve={100}
        style={filterStyle}
      >
        {filter === "__filter" ? (
          <Iconz name="filter" size={16} />
        ) : (
          <Text type="TertiaryHighlight">{filter}</Text>
        )}
      </Chip>
    </Pressable>
  );
};

export default memo(FilterHead);

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    // backgroundColor: Colors.Background.Primary,
  },
  filterButtonContainer: {
    paddingLeft: 24,
  },
  list: {
    paddingRight: 24,
    gap: 8,
    paddingLeft: 12,
  },
  filterView: {
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
});
