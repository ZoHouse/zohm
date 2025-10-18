import { useCurrency } from "@/context/CurrencyContext";
import { StyleSheet, View } from "react-native";
import ZoImage from "../../ui/ZoImage";
import { Text } from "@/components/ui";
import { memo } from "react";

interface RoomCardProps {
  room: {
    count: number;
    price: number;
    total_amount: number;
    final_amount: number;
    name: string;
    occupancy: number;
    image: string;
    id: string;
  };
  totalNights: number;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, totalNights }) => {
  const { formatCurrency } = useCurrency();

  if (!room) return <></>;

  return (
    <View key={room.id} style={styles.roomItem}>
      <View style={styles.roomImage}>
        <ZoImage url={room.image} width={120} />
      </View>
      <View style={styles.roomContent}>
        <Text numberOfLines={2} type="Subtitle">
          {room.name}
        </Text>
        <View style={styles.roomInner}>
          <View>
            <Text type="Subtitle">
              {formatCurrency(room.price)} x {room.count}
            </Text>
            <Text type="Tertiary">
              for {totalNights} {totalNights > 1 ? "nights" : "night"}
            </Text>
          </View>
          <View style={styles.flexEnd}>
            <Text>{formatCurrency(room.price * room.count * totalNights)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  flexEnd: { alignItems: "flex-end" },
  roomImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
    borderCurve: "continuous",
  },
  roomItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  roomContent: {
    flex: 1,
    gap: 4,
  },
  roomInner: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    justifyContent: "space-between",
  },
});

export default memo(RoomCard);
