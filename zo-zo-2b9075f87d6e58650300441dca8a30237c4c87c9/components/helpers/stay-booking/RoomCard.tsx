import { Text, View } from "@/components/ui";
import { useCurrency } from "@/context/CurrencyContext";
import ZoImage from "../../ui/ZoImage";
import { StyleSheet } from "react-native";
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
        <ZoImage url={room.image} width={120} id={room.id} />
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
          <View style={styles.roomPriceContainer}>
            <Text>{formatCurrency(room.price * room.count * totalNights)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default memo(RoomCard);

const styles = StyleSheet.create({
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
  roomImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
  },
  roomPriceContainer: {
    alignItems: "flex-end",
  },
});
