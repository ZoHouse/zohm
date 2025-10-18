import { StyleSheet } from "react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useThemeColors } from "@/context/ThemeContext";
import typography from "@/config/typography.json";
import {
  BottomSheetFlashList,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import Fuse, { IFuseOptions } from "fuse.js";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { ListRenderItem } from "@shopify/flash-list";
import Sheet, { SheetProps } from "@/components/sheets/Base";
import SafeAreaView from "@/components/ui/SafeAreaView";
import Pressable from "@/components/ui/Pressable";
import Iconz from "@/components/ui/Iconz";
import Loader from "@/components/ui/Loader";
import View from "@/components/ui/View";

interface ListSearchSheetProps<T> extends Omit<SheetProps, "children"> {
  listData: T[];
  selectedValue: T | null;
  onSelect?: (item: T) => void;
  keyExtractor: (item: T) => string;
  renderItem: ListRenderItem<T>;
  fuseOptions?: IFuseOptions<T>;
}

const ListSearchSheet = <T,>({
  listData,
  selectedValue,
  onSelect,
  keyExtractor,
  renderItem,
  fuseOptions,
  ...props
}: ListSearchSheetProps<T>) => {
  const [searchValue, setSearchValue] = useState<string>("");
  const clearSearch = useCallback(() => {
    if (searchValue) {
      setSearchValue("");
    } else {
      props.onDismiss?.();
    }
  }, [searchValue, props.onDismiss]);

  const fuse = useRef(new Fuse(listData, fuseOptions));
  const listRef = useRef<React.FC>(null);

  useEffect(() => {
    const list = listRef.current;
    // @ts-ignore
    list?.scrollToOffset?.({ offset: 0, animated: true });
  }, [searchValue]);

  const filteredList = useMemo(() => {
    if (searchValue) {
      return fuse.current.search(searchValue).map((item) => item.item);
    }
    return listData;
  }, [searchValue, listData]);

  const [placeHolderColor, inputColor] = useThemeColors([
    "Text.Secondary",
    "Text.Primary",
  ]);

  const { inputStyle } = useMemo(() => {
    return {
      inputStyle: [styles.input, { color: inputColor }],
    };
  }, [inputColor]);

  return (
    <Sheet hideHandle fullScreen {...props}>
      <SafeAreaView safeArea="top" style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={clearSearch} style={styles.cross}>
            <Iconz name="cross" size={24} fillTheme="Primary" />
          </Pressable>
          <BottomSheetTextInput
            placeholder="Search by name or code"
            style={inputStyle}
            value={searchValue}
            onChangeText={setSearchValue}
            autoFocus
            placeholderTextColor={placeHolderColor}
            selectionColor={inputColor}
          />
        </View>
        {filteredList.length ? (
          <Animated.View
            style={styles.flex}
            entering={FadeIn}
            exiting={FadeOut}
            key={"list"}
          >
            <BottomSheetFlashList
              ref={listRef}
              keyboardShouldPersistTaps="handled"
              data={filteredList}
              contentContainerStyle={styles.flatList}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              extraData={selectedValue}
              estimatedItemSize={56}
            />
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={styles.loader}
            key={"loader"}
          >
            <Loader />
          </Animated.View>
        )}
      </SafeAreaView>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: "stretch",
  },
  flex: { flex: 1 },
  loader: {
    marginTop: 120
  },
  input: {
    backgroundColor: "transparent",
    ...typography.BigButton,
    textAlignVertical: "center",
    height: 56,
    flex: 1,
    paddingTop: 4,
  },
  header: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 8,
  },
  cross: { paddingVertical: 16, paddingHorizontal: 16 },
  flatList: { paddingVertical: 16, paddingHorizontal: 24 },
});

export default ListSearchSheet;
