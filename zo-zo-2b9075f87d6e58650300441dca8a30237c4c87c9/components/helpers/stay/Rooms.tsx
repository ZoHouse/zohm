import { FeedAvailabilityItem, FeedPricingItem } from "@/definitions/booking";
import { Operator } from "@/definitions/discover";
import { roomSorter } from "@/utils/booking";
import { memo, useMemo } from "react";
import RoomCard from "@/components/helpers/stay/RoomCard";

const Rooms = memo(
  ({
    operator,
    availability,
    pricing,
    isLoading,
    cart,
    setCount,
    toGallery,
  }: {
    operator: Operator;
    pricing: Record<string, FeedPricingItem | undefined>;
    availability: Record<string, FeedAvailabilityItem | undefined>;
    isLoading: boolean;
    cart: Record<string, number>;
    setCount: (roomId: string, count: number) => void;
    toGallery: (roomId?: string) => void;
  }) => {
    const sortedRooms = useMemo(
      () =>
        operator.rooms.sort((a, b) => roomSorter(a, b, pricing, availability)),
      [operator.rooms, pricing, availability]
    );

    return sortedRooms.map((room) => (
      <RoomCard
        operatorCode={operator.code}
        key={room.id}
        availability={availability[room.id]}
        pricing={pricing[room.id]}
        room={room}
        isLoading={isLoading}
        count={cart[room.id] ?? 0}
        setCount={setCount}
        toGallery={toGallery}
        operator={operator}
      />
    ));
  }
);

export default memo(Rooms);
