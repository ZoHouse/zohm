import { FlatList, StyleSheet, View } from "react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { isValidString } from "@/utils/data-types/string";
import helpers from "@/utils/styles/helpers";
import { GooglePlace } from "@/definitions/general";
import { getGooglePlacesApi } from "@/utils/geo";
import Pressable from "@/components/ui/Pressable";
import Text from "@/components/ui/Text";
import Iconz from "@/components/ui/Iconz";
import Loader from "@/components/ui/Loader";
import TextInput from "@/components/ui/TextInput";
import Emooji from "@/components/ui/Emooji";

interface CitySearchProps {
  onSelect: (place: GooglePlace) => void;
  inSheet?: boolean;
  header?: { title: string; onPress: () => void };
}

const CitySearch = ({ onSelect, inSheet = false, header }: CitySearchProps) => {
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<GooglePlace[]>([]);

  const Component = useMemo(
    () => (inSheet ? BottomSheetFlatList : FlatList),
    [inSheet]
  );

  const [isLoading, setIsLoading] = useState(false);

  const fetchGooglePlaces = useCallback(async (query: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(getGooglePlacesApi(query));
      const data = await response.json();
      const formattedPlaces: GooglePlace[] = data.predictions.map(
        (prediction: any) => ({
          ...prediction,
          id: prediction.place_id,
          name: prediction.structured_formatting.main_text,
          address: prediction.structured_formatting.secondary_text,
        })
      );
      setPlaces(formattedPlaces);
    } catch (error) {
      console.error("Error fetching places:", error);
    }
    setIsLoading(false);
  }, []);

  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query) {
      setIsLoading(true);
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      debounceTimeout.current = setTimeout(() => {
        fetchGooglePlaces(query);
      }, 1000);
    } else {
      setPlaces([]);
      setIsLoading(false);
    }
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [query, fetchGooglePlaces]);

  const renderHead = useCallback(
    () =>
      header ? (
        <Pressable onPress={header.onPress} style={styles.placeItem}>
          <Iconz name="locate-me" size={16} fillTheme="Primary" />
          <View style={styles.placeItemContent}>
            <Text type="SubtitleHighlight" color="Primary" numberOfLines={1}>
              {header.title}
            </Text>
          </View>
        </Pressable>
      ) : (
        <></>
      ),
    [header]
  );

  const renderItem = useCallback(
    ({ item }: { item: GooglePlace }) => (
      <Pressable onPress={() => onSelect(item)} style={styles.placeItem}>
        <Emooji size={24}>📍</Emooji>
        <View style={styles.placeItemContent}>
          <Text type="SubtitleHighlight" numberOfLines={1}>
            {item.name}
          </Text>
          {isValidString(item.address) && (
            <Text type="Subtitle" color="Secondary" numberOfLines={1}>
              {item.address}
            </Text>
          )}
        </View>
      </Pressable>
    ),

    [onSelect]
  );

  const clearQuery = useCallback(() => setQuery(""), []);

  const textInput = useMemo(
    () => (
      <TextInput
        placeholder="Search by city name"
        value={query}
        onChangeText={setQuery}
        autoFocus
        returnKeyType="done"
        style={styles.input}
      />
    ),

    [query, setQuery]
  );

  const searchIcon = useMemo(
    () => (
      <View style={styles.searchIcon}>
        <Iconz name="search" size={24} fillTheme="ViewOnly" />
      </View>
    ),

    []
  );

  return (
    <View style={styles.searchView}>
      <View>
        {textInput}
        {query.length > 0 && (
          <Pressable
            style={styles.crossIcon}
            disabled={query.length === 0}
            onPress={clearQuery}
          >
            <Iconz name="cross-circle" size={24} fillTheme="Primary" />
          </Pressable>
        )}
        {searchIcon}
      </View>
      {isLoading ? (
        <Animated.View
          style={styles.loader}
          entering={FadeIn}
          exiting={FadeOut}
          key="loader"
        >
          <Loader width={32} height={32} />
        </Animated.View>
      ) : (
        <Animated.View
          style={styles.flex}
          entering={FadeIn}
          exiting={FadeOut}
          key="list"
        >
          <Component
            data={places}
            style={styles.flex}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListHeaderComponent={header ? renderHead : undefined}
            keyboardShouldPersistTaps="handled"
          />
        </Animated.View>
      )}
    </View>
  );
};

export default CitySearch;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  searchView: {
    ...helpers.stretch,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  loader: {
    alignSelf: "stretch",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 82,
  },
  placeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  placeItemContent: {
    flex: 1,
    height: 40,
    justifyContent: "center",
  },
  searchIcon: { position: "absolute", left: 16, top: 16 },
  crossIcon: { position: "absolute", top: 16, right: 16 },
  input: {
    marginBottom: 8,
    paddingHorizontal: 52,
    borderRadius: 100,
    borderCurve: "continuous",
  },
  container: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "flex-start",
  },
});
