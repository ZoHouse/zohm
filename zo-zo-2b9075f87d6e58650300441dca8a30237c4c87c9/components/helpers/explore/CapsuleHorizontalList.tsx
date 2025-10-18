import React, { useCallback, useMemo } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { Track } from "@/definitions/explore";
import { Fn } from "@/definitions/general";
import { groupList } from "@/utils/object";
import { FlashList } from "@shopify/flash-list";
import { Pressable, Text } from "@/components/ui";
import ZoImage from "@/components/ui/ZoImage";

const gap = 24;
const innerGap = 8;
const size = {
  capsule: {
    width: 120,
    height: 228,
  },
  capsuleImage: {
    width: 120,
    height: 180,
  },
  capsuleContainer: {
    width: 120,
    height: 228 + 228 + gap,
  },
};

interface CapsuleProps {
  url: string;
  title?: string;
  subtitle?: string;
  id: string;
  deeplink?: string;
}

const Capsule = ({ url, title, subtitle, id, deeplink }: CapsuleProps) => {
  const onPress = useCallback(() => {
    if (!deeplink) return;
    Linking.openURL(deeplink);
  }, [deeplink]);

  return (
    <Pressable activeOpacity={0.8} style={styles.capsule} onPress={onPress}>
      <View style={styles.capsuleImage}>
        <ZoImage url={url} id={id} width="s" />
      </View>
      <View style={styles.capsuleTextContainer}>
        <Text numberOfLines={1} center>
          {title}
        </Text>
        {subtitle && (
          <Text numberOfLines={2} type="Subtitle" color="Secondary" center>
            {subtitle}
          </Text>
        )}
      </View>
    </Pressable>
  );
};

interface CapsuleHorizontalListSingleProps<T extends Track> {
  data: T[];
}

interface CapsuleHorizontalListGridProps<T extends Track> {
  data: T[];
  assignScroll?: (fn?: Fn) => void;
}

interface CapsuleHorizontalListProps<T extends Track> {
  data: T[];
  grid?: true;
  assignScroll?: (fn?: Fn) => void;
}

const CapsuleHorizontalListSingle = <T extends Track>({
  data,
}: CapsuleHorizontalListSingleProps<T>) => {
  const renderItem = useCallback(({ item }: { item: T }) => {
    return (
      <View style={{ marginRight: 24 }}>
        <Capsule
          url={item.media}
          title={item.title}
          subtitle={item.subtitle}
          id={item.id}
          deeplink={item.deeplink}
        />
      </View>
    );
  }, []);

  return (
    <View>
      <FlashList
        data={data}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        estimatedItemSize={size.capsule.width + 16}
        contentContainerStyle={styles.contentContainer}
      />
    </View>
  );
};

const CapsuleHorizontalListMultiple = <T extends Track>({
  data,
  assignScroll,
}: CapsuleHorizontalListGridProps<T>) => {
  const list = useMemo(() => {
    return groupList(data, 2) as [T, T | undefined][];
  }, [data]);

  const renderItem = useCallback(({ item }: { item: [T, T | undefined] }) => {
    return (
      <View style={{ gap, marginRight: 24 }}>
        <Capsule
          url={item[0].media}
          title={item[0].title}
          id={item[0].id}
          deeplink={item[0].deeplink}
        />
        {item[1] && (
          <Capsule
            url={item[1].media}
            title={item[1].title}
            id={item[1].id}
            deeplink={item[1].deeplink}
          />
        )}
      </View>
    );
  }, []);

  return (
    <View>
      <FlashList
        ref={(ref) =>
          assignScroll?.(() =>
            ref?.scrollToOffset({ offset: 0, animated: true })
          )
        }
        data={list}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        estimatedItemSize={size.capsule.width + 16}
        contentContainerStyle={styles.contentGridContainer}
      />
    </View>
  );
};

export default function CapsuleHorizontalList<T extends Track>(
  props: CapsuleHorizontalListProps<T>
) {
  return (
    <>
      {props.grid ? (
        <CapsuleHorizontalListMultiple {...props} />
      ) : (
        <CapsuleHorizontalListSingle data={props.data} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingLeft: 24,
    paddingRight: 8,
  },
  contentGridContainer: {
    paddingLeft: 24,
  },
  capsule: {
    width: size.capsule.width,
    // maxHeight: size.capsule.height,
    // justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  capsuleImage: {
    width: size.capsuleImage.width,
    height: size.capsuleImage.height,
    borderRadius: 100,
    overflow: "hidden",
    borderCurve: "continuous",
  },
  capsuleTextContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  capsuleText: {
    textAlign: "center",
  },
});
