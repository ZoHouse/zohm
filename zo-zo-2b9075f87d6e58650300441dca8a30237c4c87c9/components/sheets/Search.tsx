import { View, StyleSheet, Keyboard } from "react-native";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { isValidString } from "@/utils/data-types/string";
import LottieView from "lottie-react-native";
import useQuery from "@/hooks/useQuery";
import { BottomSheetFlashList } from "@gorhom/bottom-sheet";
import { logAxiosError } from "@/utils/network";
import { queryResultsToSections } from "@/utils/search";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
} from "react-native-reanimated";
import { router } from "expo-router";
import { useBooking } from "@/context/BookingContext";
import useVisibilityState from "@/hooks/useVisibilityState";
import DatePicker from "@/components/sheets/DatePicker";
import Sheet from "@/components/sheets/Base";
import ZoImage from "@/components/ui/ZoImage";
import SafeAreaView from "@/components/ui/SafeAreaView";
import Pressable from "@/components/ui/Pressable";
import Iconz from "@/components/ui/Iconz";
import Ziew from "@/components/ui/View";
import Text from "@/components/ui/Text";
import TextInput from "@/components/ui/TextInput";
import Loader from "@/components/ui/Loader";
import Logger from "@/utils/logger";

interface SearchProps {
  isOpen: boolean;
  onDismiss: () => void;
}

const Search = ({ isOpen, onDismiss }: SearchProps) => {
  const [search, setSearch] = useState("");
  const [isWatching, setIsWatching] = useState(false);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { startDate, endDate } = useBooking();
  const [isDatePickerOpen, showDatePicker, hideDatePicker] =
    useVisibilityState(false);

  const openDatePicker = useCallback(() => {
    Keyboard.dismiss();
    showDatePicker();
  }, []);

  const dateText = useMemo(() => {
    return `🗓️   ${startDate.format("MMM DD")} - ${endDate.format("MMM DD")}`;
  }, [startDate, endDate]);

  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);
    if (isValidString(text)) {
      setIsWatching(true);
    }
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    typingTimeout.current = setTimeout(() => {
      // await analytics().logViewSearchResults({
      //   search_term: text,
      // });

      setIsWatching(false);
    }, 1000);
  }, []);

  const { data, isLoading, isFetching } = useQuery(
    "DISCOVER_SEARCH",
    {
      enabled: search.length > 2 && !isWatching,
      select: (data) => data.data,
      throwOnError: (error) => {
        logAxiosError(error);
        return false;
      },
    },
    {
      search: {
        q: search.trim(),
      },
    }
  );

  const { data: tripResults } = useQuery(
    "BOOKINGS_TRIP",
    {
      enabled: search.length > 2 && !isWatching,
      select: (data) => data.data.results,
      throwOnError: (error) => {
        logAxiosError(error);
        return false;
      },
    },
    {
      path: ["inventories"],
      search: {
        search: search.trim(),
      },
    }
  );

  const onClose = useCallback(() => {
    handleSearchChange("");
    onDismiss();
  }, [onDismiss, handleSearchChange]);

  const sectionalData = useMemo(
    () => queryResultsToSections(data, tripResults),
    [data, tripResults]
  );

  useEffect(() => {
    if (sectionalData.length && search.length > 2) {
      Logger.search(search);
    }
  }, [sectionalData.length]);

  const renderSectionHeader = useCallback(
    (title: string) => (
      <Ziew background="Secondary" style={styles.sectionhead}>
        <Text type="SubtitleHighlight" style={styles.sectionheadText}>
          {title}
        </Text>
      </Ziew>
    ),
    []
  );

  const onPress = useCallback(
    (screen: string, id: string) => {
      if (screen === "property") {
        onDismiss();
        router.push(`/property/${id}`);
      } else if (screen === "trip") {
        onDismiss();
        router.push(`/trip/${id}`);
      } else if (screen === "destination") {
        onDismiss();
        router.push(`/destination/${id}`);
      }
    },
    [onDismiss]
  );

  const renderItem = useCallback(
    ({ item }: { item: (typeof sectionalData)[number] }) =>
      typeof item === "string" ? (
        renderSectionHeader(item)
      ) : (
        <Pressable
          activeOpacity={0.8}
          onPress={() => onPress(item.screen, item.id)}
          style={styles.row}
        >
          <View style={styles.item}>
            <ZoImage url={item.media} id={null} width={120} />
          </View>
          <Text style={styles.flex} type="Subtitle">
            {item.name}
          </Text>
        </Pressable>
      ),
    []
  );

  return (
    <Sheet fullScreen isOpen={isOpen} hideHandle onDismiss={onClose}>
      <SafeAreaView style={styles.screen} safeArea="top">
        <View style={styles.screen}>
          <View style={styles.header}>
            <Pressable style={styles.iconBtn} onPress={onClose}>
              <Iconz size={24} name="cross" />
            </Pressable>
            <Pressable onPress={openDatePicker}>
              <Ziew background="Input" style={styles.datePicker}>
                <Text type="Tertiary">{dateText}</Text>
                <Iconz size={12} name="downAngle" fillTheme="ViewOnly" />
              </Ziew>
            </Pressable>
            <View style={styles.headTrailing} />
          </View>
          <View style={styles.input}>
            <TextInput
              placeholder="Search"
              autoFocus
              inSheet
              onChangeText={handleSearchChange}
            />
          </View>
          <View style={styles.content}>
            {search.length > 0 ? (
              isWatching || isFetching || isLoading ? (
                <Loading />
              ) : sectionalData.length > 0 ? (
                <Animated.View
                  exiting={FadeOutDown}
                  entering={FadeInDown}
                  style={styles.flex}
                  key="list"
                >
                  <BottomSheetFlashList
                    data={sectionalData}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                  />
                </Animated.View>
              ) : (
                <NotFound />
              )
            ) : (
              <SearchText />
            )}
          </View>
        </View>
      </SafeAreaView>
      {isDatePickerOpen && (
        <DatePicker
          isOpen={isDatePickerOpen}
          onClose={hideDatePicker}
          onSave={hideDatePicker}
        />
      )}
    </Sheet>
  );
};

export default Search;

const NotFound = memo(() => (
  <Animated.View
    key="not-found"
    entering={FadeIn}
    exiting={FadeOut}
    style={styles.lottieContainer}
  >
    <LottieView
      source={require("@/assets/lottie/no-search.json")}
      key="no-search"
      autoPlay
      loop
      style={styles.lottie}
    />
    <Text type="SectionTitle" color="ButtonSecondary" center>
      Not Found
    </Text>
  </Animated.View>
));

const SearchText = memo(() => (
  <Animated.View
    key="placeholder"
    exiting={FadeOut}
    entering={FadeIn}
    style={styles.searchText}
  >
    <Text type="Subtitle" color="Secondary" center>
      Explore destinations, trips, and unforgettable stays!
    </Text>
  </Animated.View>
));

const Loading = memo(() => (
  <Animated.View
    exiting={FadeOut}
    entering={FadeIn}
    key="loader"
    style={styles.loadingContainer}
  >
    <Loader />
  </Animated.View>
));

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginTop: 8,
  },
  content: {
    flex: 1,
    alignSelf: "stretch",
  },
  iconBtn: {
    paddingRight: 8,
    paddingVertical: 8,
  },
  datePicker: {
    borderRadius: 16,
    borderCurve: "continuous",
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  input: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headTrailing: {
    width: 24,
  },
  searchText: { alignItems: "center", marginTop: 16, paddingHorizontal: 48 },
  lottie: { width: 80, height: 80 },
  lottieContainer: {
    marginTop: 64,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: 64,
    paddingHorizontal: 24,
  },
  sectionhead: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionheadText: { textTransform: "uppercase" },
  item: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  flex: {
    flex: 1,
  },
  row: {
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  list: {
    flexGrow: 1,
    paddingBottom: 64,
  },
});
