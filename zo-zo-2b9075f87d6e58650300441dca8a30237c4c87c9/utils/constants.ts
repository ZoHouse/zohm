import device from "@/config/Device";
import { Image } from "expo-image";

const constants = {
  REGEX_EMAIL: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
  assetURLS: {
    noKids:
      "https://proxy.cdn.zo.xyz/gallery/media/images/e9c4aad5-3888-4c33-808a-95fbb4a4a9f6_20250703120338.png",
    noMales:
      "https://proxy.cdn.zo.xyz/gallery/media/images/e3f6b6c9-9cdf-44b9-bd89-ee209722708f_20250703120354.png",
    bell: "https://proxy.cdn.zo.xyz/gallery/media/images/f4ff100f-2f24-4e0d-a596-a74cab8323f5_20250703120221.png",
    redCross:
      "https://proxy.cdn.zo.xyz/gallery/media/images/85eddd6c-0cff-4720-b9d9-2440a7f5d456_20250703120248.png",
    profileGold:
      "https://proxy.cdn.zo.xyz/gallery/media/images/55b17163-1679-4593-874c-bc69e1d2b385_20250703120307.png",
    rightArrow:
      "https://proxy.cdn.zo.xyz/gallery/media/images/cea09c48-d354-4d80-acc0-4708ec4c367c_20250703120322.png",
    tripSearchError:
      "https://proxy.cdn.zo.xyz/gallery/media/images/2f3c9518-45f1-4e9e-8428-58e630440276_20250703120430.png",
    zobuGroup:
      "https://proxy.cdn.zo.xyz/gallery/media/images/6264f784-012b-48ca-8ab2-eb9762b5084c_20250703120458.png",
    liveLocation:
      "https://proxy.cdn.zo.xyz/gallery/media/images/8fdfa3f2-4d2f-431a-8ba4-a0d5e19c4899_20250703120601.png",
    walletBackground:
      "https://proxy.cdn.zo.xyz/gallery/media/images/2e1fe74c-673c-4acd-a5aa-4ac13027dfb2_20250706072110.png",
    walletCover:
      "https://proxy.cdn.zo.xyz/gallery/media/images/aeb1d508-c511-46a9-b4f8-260ea8825c6a_20250706072152.png",
    shine:
      "https://proxy.cdn.zo.xyz/gallery/media/images/2a117a82-e399-4278-8eac-0d5b9209d150_20250706073538.png",
    paymentRetry:
      "https://proxy.cdn.zo.xyz/gallery/media/images/b5bee1bc-667c-4089-9ffc-dacbc0734de9_20250318124912.png",
    paymentSupport:
      "https://proxy.cdn.zo.xyz/gallery/media/images/3b7e42d1-9dac-4e23-a20d-69417e4eb1fa_20250318124936.png",
    passportFounder:
      "https://proxy.cdn.zo.xyz/gallery/media/images/a1659b07-94f0-4490-9b3c-3366715d9717_20250515053726.png",
    passport:
      "https://proxy.cdn.zo.xyz/gallery/media/images/bda9da5a-eefe-411d-8d90-667c80024463_20250515053805.png",
    earth:
      "https://proxy.cdn.zo.xyz/gallery/media/images/530ee409-8884-4d64-8e29-659e11f61fae_20250411022753.png",
  },
  videos: {
    miniMap:
      "https://proxy.cdn.zo.xyz/transcoded/autoxauto/9240d04a-e2fc-4853-a5fa-ff8feb0c245c_20250706145500.mp4?w=80",
  },
  assetWidths: {
    paymentRetry: 360,
    paymentSupport: 360,
    zobuGroup: 480,
    rightArrow: 180,
    profileGold: 180,
    noKids: 240,
    noMales: 240,
    earth: 80,
  },
  map: {
    aspect: device.WINDOW_WIDTH / device.WINDOW_HEIGHT,
    cardSpacing: 16,
    cardWidth: device.WINDOW_WIDTH - 64,
    cardHeight: (device.WINDOW_WIDTH - 64) / (4 / 3),
    spacingForCardInset: device.WINDOW_WIDTH * 0.1 - 16,
    latitudeDelta: 0.4,
    longitudeDelta: 0.4 * device.ASPECT_RATIO,
    countryInitialRegion: {
      latitude: 20.5937,
      longitude: 81.5,
      latitudeDelta: 60,
      longitudeDelta: 60 * device.ASPECT_RATIO,
    },
    mapStyle: [
      {
        featureType: "administrative.land_parcel",
        elementType: "labels",
        stylers: [
          {
            visibility: "off",
          },
        ],
      },
      {
        featureType: "poi",
        elementType: "labels.text",
        stylers: [
          {
            visibility: "off",
          },
        ],
      },
      {
        featureType: "road.local",
        elementType: "labels",
        stylers: [
          {
            visibility: "off",
          },
        ],
      },
    ],
    urls: {
      zostel: "https://cdn.zostel.com/app/assets/map-zostel.png",
      "zostel-homes": "https://cdn.zostel.com/app/assets/map-homes.png",
      "zostel-plus": "https://cdn.zostel.com/app/assets/map-plus.png",
      "trusted-by-zostel":
        "https://cdn.zostel.com/app/assets/map-trusted-by-zostel.png",
      "zo-house":
        "https://static.cdn.zo.xyz/app-media/markers/map-zo-house.png",
      "zo-trip":
        "https://proxy.cdn.zo.xyz/gallery/media/images/7a506ae3-6108-48cf-9465-190437e852f6_20250915170636.png",
    },
  },
  bookings: {
    ratingEligibleStatus: ["confirmed", "checked_in", "checked_out"],
  },
};

export default constants;

const prefetchAssets = () => {
  const assets = [
    constants.assetURLS.paymentRetry,
    constants.assetURLS.paymentSupport,
    constants.assetURLS.zobuGroup,
    constants.assetURLS.rightArrow,
    constants.assetURLS.profileGold,
    constants.assetURLS.noKids,
    constants.assetURLS.noMales,
    constants.assetURLS.passportFounder,
    constants.assetURLS.passport,
    constants.assetURLS.earth,
    constants.assetURLS.walletBackground,
    constants.assetURLS.walletCover,
    constants.assetURLS.shine,
    ...Object.values(constants.map.urls),
  ].map((asset) => {
    const width =
      constants.assetWidths[asset as keyof typeof constants.assetWidths] ?? 0;
    const url = width ? `${asset}?w=${width}` : asset;
    return url;
  });

  return Image.prefetch(assets, "disk");
};

export { prefetchAssets };
