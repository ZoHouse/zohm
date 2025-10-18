import { FlatList, StyleSheet, View as RnView } from "react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Track, Playlist, FilterTracks } from "@/definitions/explore";
import { Fn } from "@/definitions/general";
import Pressable from "@/components/ui/Pressable";
import View from "@/components/ui/View";
import Text from "@/components/ui/Text";
import Chip from "@/components/ui/Chip";
import CapsuleHorizontalList from "@/components/helpers/explore/CapsuleHorizontalList";
interface ExploreFilterProps {
  data: Track[];
  tags?: Playlist["tags"];
}

interface ExploreFilterTagsProps {
  data: FilterTracks;
  categories: {
    category: string;
    emoji: string;
  }[];
}

const ExploreFilters = ({ data, tags }: ExploreFilterProps) => {
  const tagsData = useMemo(() => {
    let result: FilterTracks = {};
    data.forEach((track) => {
      track.tags?.forEach((tag) => {
        if (!result[tag.slug]) {
          result[tag.slug] = [];
        }
        result[tag.slug].push(track);
      });
    });
    result["all"] = data;
    return result;
  }, [data]);

  const categories = useMemo(() => {
    const result: { category: string; emoji: string }[] = [];
    tags?.forEach((tag) => {
      if (!tag.emoji) return;
      result.push({
        category: tag.slug,
        emoji: tag.emoji,
      });
    });
    result.unshift({
      category: "all",
      emoji: "🌟",
    });
    return result.filter((category) => tagsData[category.category]?.length);
  }, [tags, tagsData]);

  return <ExploreFilterTags data={tagsData} categories={categories} />;
};

const ExploreFilterTags = ({ data, categories }: ExploreFilterTagsProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const destinations = useMemo(
    () => data[categories[selectedIndex].category] ?? [],
    [data, selectedIndex]
  );

  const ref = useRef<FlatList>(null);

  useEffect(() => {
    ref.current?.scrollToIndex({
      index: selectedIndex,
      animated: true,
      viewPosition: 0.5,
    });
  }, [selectedIndex]);

  const resetScrollRef = useRef<Fn | undefined>(undefined);

  const scrollToBegin = useCallback((fn?: Fn) => {
    resetScrollRef.current = fn;
  }, []);

  const onSelect = useCallback((index: number) => {
    setSelectedIndex(index);
    resetScrollRef.current?.();
  }, []);
  const renderItem = useCallback(
    ({
      item,
      index,
    }: {
      item: { category: string; emoji: string };
      index: number;
    }) => (
      <Pressable onPress={() => onSelect(index)}>
        <Chip
          stroke={selectedIndex === index ? "Action" : "Primary"}
          curve={100}
          style={styles.item}
        >
          <Text type="Subtitle" style={styles.titleText}>
            {getTagText(item.emoji, item.category)}
          </Text>
        </Chip>
      </Pressable>
    ),
    [selectedIndex, setSelectedIndex]
  );

  return (
    <View>
      <FlatList
        horizontal
        ref={ref}
        data={categories}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        renderItem={renderItem}
        keyExtractor={(item) => item.category}
      />
      <CapsuleHorizontalList
        grid
        data={destinations}
        assignScroll={scrollToBegin}
      />
    </View>
  );
};

export default ExploreFilters;

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 16,
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  titleText: {
    textTransform: "capitalize",
  },
});

const getTagText = (emoji: string, category: string) =>
  emoji && category ? `${emoji} ${category}` : emoji || category;
