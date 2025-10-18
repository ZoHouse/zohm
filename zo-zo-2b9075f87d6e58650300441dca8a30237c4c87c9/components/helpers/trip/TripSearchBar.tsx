import { Iconz, Pressable, Text, View } from "@/components/ui";
import useVisibilityState from "@/hooks/useVisibilityState";
import React, { memo, useMemo } from "react";
import { StyleSheet } from "react-native";
import TripSearch from "@/components/sheets/trips/TripSearch";
import helpers from "@/utils/styles/helpers";

const TripSearchBar = () => {
  const [isSearchOpen, showSearch, hideSearch] = useVisibilityState(false);

  const searchBarContent = useMemo(
    () => (
      <Pressable onPress={showSearch} activeOpacity={0.8} style={helpers.flex}>
        <View background style={styles.searchBg}>
          <View background="Inputbox" style={styles.search}>
            <Iconz name="search" size={24} fillTheme="ViewOnly" />
            <Text color="Secondary" type="Subtitle">
              Search Destinations
            </Text>
          </View>
        </View>
      </Pressable>
    ),
    []
  );

  return (
    <>
      {searchBarContent}
      {isSearchOpen ? (
        <TripSearch isOpen={isSearchOpen} close={hideSearch} />
      ) : null}
    </>
  );
};

export default memo(TripSearchBar);

const styles = StyleSheet.create({
  search: {
    height: 56,
    alignSelf: "stretch",
    borderRadius: 100,
    borderCurve: "continuous",
    padding: 16,
    gap: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  searchBg: {
    borderRadius: 100,
    borderCurve: "continuous",
  },
  whiteSearchText: {
    color: "#12121270",
  },
});
