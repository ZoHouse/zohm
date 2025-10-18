import device from "@/config/Device";
import { MapOperator } from "@/definitions/zo";
import constants from "@/utils/constants";
import Logger from "@/utils/logger";
import { getMapURLType } from "@/utils/map";
import { Image } from "expo-image";
import { memo, useCallback, useEffect, useMemo } from "react";
import { StyleSheet } from "react-native";
import { Marker } from "react-native-maps";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface MapMarkerProps {
  operator: MapOperator;
  selected: boolean;
  setSelectedOperator: (o: MapOperator | null) => void;
}

const MapMarker = memo(
  ({ operator, selected, setSelectedOperator }: MapMarkerProps) => {
    const scale = useSharedValue(1);
    const ty = useSharedValue(0);

    useEffect(() => {
      scale.value = withTiming(selected ? 1.4 : 1, {
        duration: 300,
      });
      ty.value = withTiming(selected ? -8 : 0, {
        duration: 300,
      });
    }, [selected]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: ty.value }, { scale: scale.value }],
    }));

    const source = useMemo(() => {
      const uri =
        constants.map.urls[
          getMapURLType(operator.type_code, operator.operating_model)
        ];
      return { uri };
    }, [operator.type_code, operator.operating_model]);

    const onSelect = useCallback(() => {
      setSelectedOperator(operator);
      Logger.mapClick(operator.code, operator.name, operator.type);
    }, [operator]);

    return (
      <Marker
        key={operator.name}
        tappable
        onPress={onSelect}
        coordinate={{
          latitude: operator.latitude,
          longitude: operator.longitude,
        }}
        tracksViewChanges={false}
        zIndex={selected ? 10000 : 1}
      >
        <Animated.View style={animatedStyle}>
          <Image
            source={source}
            style={styles.container}
            key={null}
            contentFit="contain"
            cachePolicy="disk"
          />
        </Animated.View>
      </Marker>
    );
  }
);

const MapMarkerAndroid = memo(
  ({ operator, setSelectedOperator }: MapMarkerProps) => {
    const onSelect = useCallback(() => {
      setSelectedOperator(operator);
      Logger.mapClick(operator.code, operator.name, operator.type);
    }, [operator]);

    return (
      <Marker
        key={operator.name}
        tappable
        onPress={onSelect}
        coordinate={operator}
        tracksViewChanges={false}
        title={operator.name}
        style={styles.container}
      />
    );
  }
);

const selected = device.isAndroid ? MapMarkerAndroid : MapMarker;

export default selected;

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
  },
});
