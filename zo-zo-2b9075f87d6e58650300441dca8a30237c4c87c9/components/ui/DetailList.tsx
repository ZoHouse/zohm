import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import DetailRow, { DetailRowProps } from "./DetailRow";
import { useMemo } from "react";

export interface DetailListProps {
  data: (DetailRowProps & { id: string })[];
  style?: StyleProp<ViewStyle>;
  gap?: number;
  alignToTop?: boolean;
}

const DetailList = ({
  data,
  style,
  gap = 8,
  alignToTop = false,
}: DetailListProps) => {
  const s = useMemo(() => [styles.container, style], [style]);

  return (
    <View style={s}>
      {data.map((el) => (
        <DetailRow key={el.id} {...el} gap={gap} alignToTop={alignToTop} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
});

export default DetailList;
