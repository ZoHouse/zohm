import { ApplicationSeed } from "@/definitions/auth";
import { FormGuest } from "@/definitions/booking";
import { Profile } from "@/definitions/profile";

/**
 * Formats a nickname by removing the ".zo" suffix
 * @param nickname - The nickname to format
 * @returns The formatted nickname
 */
const formatNickname = (nickname?: string) =>
  (nickname || "").replace(".zo", "");

/**
 * Gets the full name of a profile
 * @param profile - The profile to get the full name of
 * @returns The full name of the profile
 */
export const getFullName = (profile?: Profile) =>
  profile
    ? [
        profile.first_name?.trim() || "",
        profile.middle_name?.trim() || "",
        profile.last_name?.trim() || "",
      ]
        .filter((n) => n != null && n !== "")
        .join(" ")
    : "";

export const getGuestFullName = (guest: FormGuest) =>
  [guest.firstName, guest.lastName ?? ""].join(" ");
/**
 * The fields of the profile
 * @type {Object}
 * @property {Array} gender - The gender of the user
 * @property {Array} ids - The ids of the user
 * @property {Array} ids - The ids of the user
 */
const ProfileFields = {
  gender: [
    {
      icon: "🙋‍♂️",
      id: "male",
      value: "Male",
    },
    {
      icon: "🙋‍♀️",
      id: "female",
      value: "Female",
    },
    {
      icon: "🥷",
      id: "other",
      value: "Other",
    },
  ],
  ids: [
    {
      id: "aadhar",
      icon: "Aadhar",
      name: "Aadhar Card",
      pages: [
        {
          id: 110,
          name: "Front Side",
          sample_image:
            "https://static.cdn.zo.xyz/app-media/samples/aadhar-front.png",
        },
        {
          id: "111",
          name: "Back Side",
          sample_image:
            "https://static.cdn.zo.xyz/app-media/samples/aadhar-back.png",
        },
      ],
    },
    {
      id: "passport-indian",
      icon: "Passport",
      name: "Passport",
      pages: [
        {
          id: 112,
          name: "Photo Page",
          sample_image:
            "https://static.cdn.zo.xyz/app-media/samples/passport-photo.png",
        },
        {
          id: 113,
          name: "Address Page",
          sample_image:
            "https://static.cdn.zo.xyz/app-media/samples/passport-address.png",
        },
      ],
    },
    {
      id: "passport",
      icon: "Passport",
      name: "Passport",
      pages: [
        {
          id: 112,
          name: "Passport Photo Page",
          sample_image:
            "https://static.cdn.zo.xyz/app-media/samples/passport-photo.png",
        },
        {
          id: 113,
          name: "Passport Address Page",
          sample_image:
            "https://static.cdn.zo.xyz/app-media/samples/passport-address.png",
        },
        {
          id: 114,
          name: "VISA Stamp Page",
          sample_image:
            "https://static.cdn.zo.xyz/app-media/samples/passport-visa.png",
        },
      ],
    },
  ],
};

export type ID = (typeof ProfileFields)["ids"][number];

export const profileCountryToCode: (
  country?: Profile["country"]
) => ApplicationSeed["mobile_country_codes"][number] | undefined = (
  country?: Profile["country"]
) =>
  country?.code
    ? {
        name: country.name,
        flag: country.flag,
        code: country.code,
        dial_code: country.mobile_code,
      }
    : undefined;

export { formatNickname, ProfileFields };
