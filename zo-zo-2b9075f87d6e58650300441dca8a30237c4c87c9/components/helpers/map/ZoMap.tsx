import {
  View,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import helpers from "@/utils/styles/helpers";
import MapView, { Details, Region } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeColors } from "@/context/ThemeContext";
import { SafeAreaView } from "@/components/ui";
import { LegendList, LegendListRef } from "@legendapp/list";
import { MapOperator } from "@/definitions/zo";
import constants from "@/utils/constants";
import MapMarker from "./MapMarker";
import MapCardView from "./MapCard";

interface ZoMapProps {
  operators: MapOperator[];
  initialRegion: Region;
  onSelect?: () => void;
  inSheet?: boolean;
}

const ZoMap = (props: ZoMapProps) => {
  const mapRef = useRef<MapView>(null);
  const listRef = useRef<LegendListRef>(null);

  const [primary] = useThemeColors(["Background.Primary"]);
  const [gradientTop] = useMemo(
    () => [[primary, `${primary}CC`, `${primary}00`] as const],
    [primary]
  );

  const [selectedOperator, setSelectedOperator] = useState<MapOperator | null>(
    null
  );
  const deltas = useRef<{
    latitudeDelta: number;
    longitudeDelta: number;
  }>({
    latitudeDelta: constants.map.latitudeDelta,
    longitudeDelta: constants.map.longitudeDelta,
  });

  // const [scrollIndex, setScrollIndex] = useState(0);
  const onSelectOperator = useCallback((operator: MapOperator | null) => {
    if (!operator) return;
    setSelectedOperator(operator);
  }, []);
  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.abs(
        Math.round(
          event.nativeEvent.contentOffset.x /
            (constants.map.cardWidth + constants.map.cardSpacing)
        )
      );
      onSelectOperator(props.operators[index]);
    },
    [props.operators]
  );

  const onMarkerPress = useCallback(
    (operator: MapOperator | null) => {
      if (!operator) return;
      const index = props.operators.findIndex((o) => o.code === operator.code);
      // setScrollIndex(index);
      listRef.current?.scrollToIndex({ index });
      onSelectOperator(operator);
    },
    [props.operators]
  );

  useEffect(() => {
    if (!selectedOperator) return;
    mapRef.current?.animateToRegion(
      {
        latitude: selectedOperator.latitude,
        longitude: selectedOperator.longitude,
        latitudeDelta: deltas.current.latitudeDelta,
        longitudeDelta: deltas.current.longitudeDelta,
      },
      300
    );
  }, [selectedOperator?.code]);

  useEffect(() => {
    if (props.operators[0]?.code) {
      const operator = props.operators[0];
      setTimeout(() => {
        onSelectOperator(operator);
      }, 300);
    }
  }, [props.operators[0]?.code]);

  const onRegionChangeComplete = useCallback(
    (region: Region, details: Details) => {
      deltas.current.latitudeDelta = region.latitudeDelta;
      deltas.current.longitudeDelta = region.longitudeDelta;
    },
    []
  );

  const keyExtractor = useCallback((item: MapOperator) => item.code, []);

  const renderItem = useCallback(({ item }: { item: MapOperator }) => {
    return <MapCardView onPrePress={props.onSelect} operator={item} />;
  }, [props.onSelect]);

  return (
    <View style={helpers.fit}>
      <MapView
        style={helpers.fit}
        initialRegion={props.initialRegion}
        customMapStyle={constants.map.mapStyle}
        ref={mapRef}
        onRegionChangeComplete={onRegionChangeComplete}
      >
        {props.operators.map((operator) => (
          <MapMarker
            key={operator.name}
            operator={operator}
            selected={selectedOperator?.code === operator.code}
            setSelectedOperator={onMarkerPress}
          />
        ))}
      </MapView>
      {!props.inSheet ? (
        <View style={styles.gradientTop}>
          <SafeAreaView safeArea="top" />
          <View style={styles.head} />
          <LinearGradient style={helpers.absoluteFit} colors={gradientTop} />
        </View>
      ) : null}
      <SafeAreaView safeArea="bottom" style={styles.bottomList}>
        <LegendList
          horizontal
          data={props.operators}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          decelerationRate="fast"
          onScroll={onScroll}
          ref={listRef}
          snapToInterval={constants.map.cardWidth + constants.map.cardSpacing}
          keyExtractor={keyExtractor}
        />
      </SafeAreaView>
    </View>
  );
};

export default ZoMap;

const styles = StyleSheet.create({
  gradientTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  head: {
    height: 56,
  },
  bottomList: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
  },
  bottomListContent: {
    height: constants.map.cardHeight,
  },
  list: {
    height: constants.map.cardHeight,
  },
  listContent: {
    gap: constants.map.cardSpacing,
    paddingHorizontal: 24,
  },
});
