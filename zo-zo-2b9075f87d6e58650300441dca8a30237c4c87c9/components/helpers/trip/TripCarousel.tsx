import { Media } from "@/definitions/booking";
import { RoomCardCarousel } from "../stay";
import { memo, useCallback } from "react";
import device from "@/config/Device";
import { router } from "expo-router";

interface TripCarouselProps {
  media: Media[];
  pid: string;
}
const tripCarouselAspectRatio = 3 / 4;

const TripCarousel = ({ media, pid }: TripCarouselProps) => {
  const onPress = useCallback(
    (index: number) => {
      router.push({
        pathname: "/gallery",
        params: {
          type: "trip",
          code: pid,
        },
      });
    },
    [pid]
  );

  return (
    <RoomCardCarousel
      images={media}
      aspectRatio={tripCarouselAspectRatio}
      w="2xl"
      onPress={onPress}
    />
  );
};

export default memo(TripCarousel);
