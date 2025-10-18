import React, { memo, useMemo } from "react";
import { Image } from "expo-image";
import { useThemeColors } from "@/context/ThemeContext";

const AllAmenities = {
  "25": {
    id: 25,
    name: "Television",
    code: "tv",
    icon: () => require("@/assets/vectors/amenities/tv.svg"),
  },
  "3": {
    id: 3,
    name: "Mountain View",
    code: "terrain",
    icon: () => require("@/assets/vectors/amenities/mountain.svg"),
  },
  "4": {
    id: 4,
    name: "Lockers",
    code: "vpn_key",
    icon: () => require("@/assets/vectors/amenities/locker.svg"),
  },
  "5": {
    id: 5,
    name: "Swimming Pool",
    code: "pool",
    icon: () => require("@/assets/vectors/amenities/pool.svg"),
  },
  "9": {
    id: 9,
    name: "Hot water",
    code: "hot_tub",
    icon: () => require("@/assets/vectors/amenities/hot-tub.svg"),
  },
  "10": {
    id: 10,
    name: "Laundry Services (Extra)",
    code: "local_laundry_service",
    icon: () => require("@/assets/vectors/amenities/laundry.svg"),
  },
  "12": {
    id: 12,
    name: "Pickup",
    code: "commute",
    icon: () => require("@/assets/vectors/amenities/pickup.svg"),
  },
  "13": {
    id: 13,
    name: "Free Wi-Fi",
    code: "wifi",
    icon: () => require("@/assets/vectors/amenities/wifi.svg"),
  },
  "17": {
    id: 17,
    name: "Card Payment Accepted",
    code: "payment",
    icon: () => require("@/assets/vectors/amenities/card-payment.svg"),
  },
  "19": {
    id: 19,
    name: "Common Television",
    code: "tv",
    icon: () => require("@/assets/vectors/amenities/tv.svg"),
  },
  "14": {
    id: 14,
    name: "Water Dispenser",
    code: "local_drink",
    icon: () => require("@/assets/vectors/amenities/water-dispenser.svg"),
  },
  "23": {
    id: 23,
    name: "Air-conditioning",
    code: "ac_unit",
    icon: () => require("@/assets/vectors/amenities/ac.svg"),
  },
  "7": {
    id: 7,
    name: "24/7 Reception",
    code: "room_service",
    icon: () => require("@/assets/vectors/amenities/room-service.svg"),
  },
  "11": {
    id: 11,
    name: "Common hangout area",
    code: "casino",
    icon: () => require("@/assets/vectors/amenities/comon-area.svg"),
  },
  "16": {
    id: 16,
    name: "Cafe",
    code: "restaurant",
    icon: () => require("@/assets/vectors/amenities/cafe.svg"),
  },
  "6": {
    id: 6,
    name: "In-house Activities",
    code: "sports_esports",
    icon: () => require("@/assets/vectors/amenities/inhouse-activities.svg"),
  },
  "27": {
    id: 27,
    name: "Towels Included",
    code: "checkroom",
    icon: () => require("@/assets/vectors/amenities/towels.svg"),
  },
  "26": {
    id: 26,
    name: "Bedside Lamps",
    code: "wb_incandescent",
    icon: () => require("@/assets/vectors/amenities/bedside-lamp.svg"),
  },
  "22": {
    id: 22,
    name: "Extra bed on request",
    code: "hotel",
    icon: () => require("@/assets/vectors/amenities/extra-bed.svg"),
  },
  "21": {
    id: 21,
    name: "Breakfast (Extra)",
    code: "free_breakfast",
    icon: () => require("@/assets/vectors/amenities/breakfast.svg"),
  },
  "2": {
    id: 2,
    name: "Sea View",
    code: "beach_access",
    icon: () => require("@/assets/vectors/amenities/sea-view.svg"),
  },
  "1": {
    id: 1,
    name: "Valley View",
    code: "landscape",
    icon: () => require("@/assets/vectors/amenities/valley-view.svg"),
  },
  "8": {
    id: 8,
    name: "Storage Facility",
    code: "luggage",
    icon: () => require("@/assets/vectors/amenities/storage-facility.svg"),
  },
  "20": {
    id: 20,
    name: "Towels on rent",
    code: "layers",
    icon: () => require("@/assets/vectors/amenities/towels-on-rent.svg"),
  },
  "18": {
    id: 18,
    name: "Linen Included",
    code: "airline_seat_individual_suite",
    icon: () => require("@/assets/vectors/amenities/lenin-included.svg"),
  },
  "28": {
    id: 28,
    name: "Lake View",
    code: "waves",
    icon: () => require("@/assets/vectors/amenities/lake-view.svg"),
  },
  "29": {
    id: 29,
    name: "UPI Payment Accepted",
    code: "qr_code_scanner",
    icon: () => require("@/assets/vectors/amenities/upi.svg"),
  },
  "30": {
    id: 30,
    name: "Jacuzzi",
    code: "hot_tub",
    icon: () => require("@/assets/vectors/amenities/hot-tub.svg"),
  },
  "32": {
    id: 32,
    name: "Balcony",
    code: "balcony",
    icon: () => require("@/assets/vectors/amenities/balcony.svg"),
  },
  "31": {
    id: 31,
    name: "Pets Allowed",
    code: "pets",
    icon: () => require("@/assets/vectors/amenities/pets-allowed.svg"),
  },
  "24": {
    id: 24,
    name: "Shower",
    code: "shower",
    icon: () => require("@/assets/vectors/amenities/shower.svg"),
  },
  "33": {
    id: 33,
    name: "River View",
    code: "water",
    icon: () => require("@/assets/vectors/amenities/river-view.svg"),
  },
  "34": {
    id: 34,
    name: "Bar",
    code: "liquor",
    icon: () => require("@/assets/vectors/amenities/bar.svg"),
  },
  "35": {
    id: 35,
    name: "Gym",
    code: "fitness_center",
    icon: () => require("@/assets/vectors/amenities/gym.svg"),
  },
  "15": {
    id: 15,
    name: "Parking",
    code: "local_parking",
    icon: () => require("@/assets/vectors/amenities/parking.svg"),
  },
  "36": {
    id: 36,
    name: "Parking (private)",
    code: "local_parking",
    icon: () => require("@/assets/vectors/amenities/private-parking.svg"),
  },
  "37": {
    id: 37,
    name: "Parking (public)",
    code: "local_parking",
    icon: () => require("@/assets/vectors/amenities/parking.svg"),
  },
  "38": {
    id: 38,
    name: "Breakfast Buffet (Extra)",
    code: "fastfood",
    icon: () => require("@/assets/vectors/amenities/breakfast-buffet.svg"),
  },
  "39": {
    id: 39,
    name: "Pets allowed",
    code: "pets",
    icon: () => require("@/assets/vectors/amenities/pets-allowed.svg"),
  },
  "41": {
    id: 41,
    name: "Central Heating",
    code: "hvac",
    icon: () => require("@/assets/vectors/amenities/central-heating.svg"),
  },
  "40": {
    id: 40,
    name: "H",
    code: "Hvac",
    icon: () => require("@/assets/vectors/amenities/hvac.svg"),
  },
  "42": {
    id: 42,
    name: "Charging Points",
    code: "dock",
    icon: () => require("@/assets/vectors/amenities/charging-point.svg"),
  },
  "43": {
    id: 43,
    name: "Power Backup",
    code: "power_settings_new",
    icon: () => require("@/assets/vectors/amenities/charging-point.svg"),
  },
  "44": {
    id: 44,
    name: "EV Charging Station",
    code: "ev_station",
    icon: () => require("@/assets/vectors/amenities/ev-charging-station.svg"),
  },
  "45": {
    id: 45,
    name: "Bonfire",
    code: "local_fire_department",
    icon: () => require("@/assets/vectors/amenities/bonfire.svg"),
  },
  "46": {
    id: 46,
    name: "Indoor Games",
    code: "games",
    icon: () => require("@/assets/vectors/amenities/indoor-games.svg"),
  },
  "47": {
    id: 47,
    name: "Refrigerator",
    code: "kitchen",
    icon: () => require("@/assets/vectors/amenities/refrigerator.svg"),
  },
  "48": {
    id: 48,
    name: "Iron",
    code: "iron",
    icon: () => require("@/assets/vectors/amenities/iron.svg"),
  },
  "49": {
    id: 49,
    name: "Room service",
    code: "room_service",
    icon: () => require("@/assets/vectors/amenities/room-service.svg"),
  },
  "50": {
    id: 50,
    name: "Two-Wheelers on Rent",
    code: "two_wheeler",
    icon: () => require("@/assets/vectors/amenities/two-wheeler-on-rent.svg"),
  },
  "53": {
    id: 53,
    name: "Luggage Assistance",
    code: "f235",
    icon: () => require("@/assets/vectors/amenities/luggage-assistance.svg"),
  },
  "54": {
    id: 54,
    name: "Luggage Assistance",
    code: '<span class="material-symbols-outlined"> luggage </span>',
    icon: () => require("@/assets/vectors/amenities/luggage-assistance.svg"),
  },
  "55": {
    id: 55,
    name: "Luggage Assistance",
    code: "backpack",
    icon: () => require("@/assets/vectors/amenities/backpack.svg"),
  },
  "56": {
    id: 56,
    name: "Private bonfire",
    code: "local_fire_department",
    icon: () => require("@/assets/vectors/amenities/bonfire.svg"),
  },
  "51": {
    id: 51,
    name: "Bag Assistance",
    code: "checked_bag",
    icon: () => require("@/assets/vectors/amenities/checked-bag.svg"),
  },
  "52": {
    id: 52,
    name: "Luggage Service",
    code: "luggage",
    icon: () => require("@/assets/vectors/amenities/luggage-assistance.svg"),
  },
  "57": {
    id: 57,
    name: "Complimentary Snacks",
    code: "cookie",
    icon: () => require("@/assets/vectors/amenities/breakfast.svg"),
  },
  "58": {
    id: 58,
    name: "Mini Fridge",
    code: "kitchen",
    icon: () => require("@/assets/vectors/amenities/mini-fridge.svg"),
  },
  "60": {
    id: 60,
    name: "Jacuzzi",
    code: "hot_tub",
    icon: () => require("@/assets/vectors/amenities/hot-tub.svg"),
  },
  "61": {
    id: 61,
    name: "Breakfast Included",
    code: "flatware",
    icon: () => require("@/assets/vectors/amenities/breakfast.svg"),
  },
  "62": {
    id: 62,
    name: "Bath Essentials",
    code: "sanitizer",
    icon: () => require("@/assets/vectors/amenities/shower.svg"),
  },
  "64": {
    id: 64,
    name: "Shampoo & Body Wash",
    code: "propane_tank",
    icon: () => require("@/assets/vectors/amenities/shower.svg"),
  },
  "63": {
    id: 63,
    name: "Shampoo & Body Wash",
    code: "propane_tank",
    icon: () => require("@/assets/vectors/amenities/shower.svg"),
  },
  "59": {
    id: 59,
    name: "Electric Kettle",
    code: "blanket",
    icon: () => require("@/assets/vectors/amenities/electric-kettle.svg"),
  },
};

const AmenityIcon = memo(
  ({ name, size = 24 }: { name: string; size: number }) => {
    const icon = useMemo(() => {
      const getAmenityIcon =
        AllAmenities[name as keyof typeof AllAmenities]?.icon;
      if (getAmenityIcon) {
        return getAmenityIcon();
      }
      return null;
    }, [name]);

    const [iconColor] = useThemeColors(["Text.Primary"]);

    const iconStyle = useMemo(
      () => [
        {
          width: size,
          height: size,
        },
      ],
      [size]
    );

    return !icon ? (
      <></>
    ) : (
      <Image source={icon} style={iconStyle} tintColor={iconColor} />
    );
  }
);

export default AmenityIcon;
