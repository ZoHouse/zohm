import { Icons } from "@/components/ui/Iconz";
import { GeneralObject } from "@/definitions/general";
import { ZoCountry } from "@/definitions/zo";

export interface Profile {
  address: string;
  avatar: {
    image: string;
    metadata: string;
    ref_id: number;
  };
  bio: string;
  body_type: string;
  country: ZoCountry;
  cultures: Array<{
    description: string;
    icon: string;
    key: string;
    name: string;
  }>;
  custom_nickname?: string;
  date_of_birth?: string;
  email_address?: string;
  email_verified: boolean;
  ens_nickname?: string;
  first_name: string;
  founder_tokens: string[];
  gender: string;
  home_location?: {
    lat: number;
    lng: number;
  };
  last_name?: string;
  membership: "founder" | "none";
  middle_name: string;
  mobile_number: string;
  mobile_verified: boolean;
  nickname?: string;
  pfp_image?: string;
  pfp_metadata: {
    contract_address: string;
    is_valid: boolean;
    metadata: {
      attributes: any[];
      description: string;
      external_url: string;
      image: string;
      title: string;
    };
    token_id: string;
  };
  pid: string;
  pincode?: string;
  place_name?: string;
  place_ref_id?: string;
  relationship_status?: string;
  selected_nickname: "custom" | "ens";
  socials: Array<{
    category: string;
    link: string;
    verified: boolean;
  }>;
  wallet_address: string;
  web3_verified: boolean;
}

export interface WhereaboutsV2 {
  location?: {
    long: number;
    lat: number;
  };
  place_name?: string;
  place_ref_id?: string;
  created_at?: string;
  updated_at?: string;
}

export type OnboardingGrant = {
  claimed: boolean;
  amount: number;
  available: number;
};

export type OnboardingGrants = OnboardingGrant[];
export interface ProfileCompletionGrants {
  grant: { id: string; name: string };
  field: keyof Profile;
  description?: string;
  amount: number;
}

// ---- UI -----

export interface ProfileInfoRow {
  emoji: string;
  icon?: Icons;
  id: string;
  label: string;
  value: string;
  content: React.JSX.Element | null;
  onPress?: () => void;
  type: "item";
}

export interface ZostelProfileAsset {
  document_type: {
    id: number;
    name: string;
    requires_back: boolean;
    slug: string;
  } | null;
  validation_status: "Pending" | "Processing" | "Validated" | "Failed";
  key: string;
  type: number;
  identifier?: string;
  file?: string;
  validation_data?: ZostelProfileValidationData | null;
  validation_error?: null;
  time_create?: string;
  time_update?: string;
}

interface ZostelProfileValidationData {
  response: {
    details: {
      name: string;
      address: string;
      country: string;
      issue_date: string | null;
      expiry_date: string | null;
      date_of_birth: string;
      document_number: string;
    };
    orientation: {
      status: string;
      confidence: number;
      anchors_found: string[];
      rotation_degrees: number;
    };
    document_type: {
      value: string;
      confidence: number;
    };
    image_quality: {
      overall: number;
      cropping: number;
      lighting: number;
      blurriness: number;
      critical_issues: string[];
      glare_reflection: number;
      orientation_score: number;
    };
  };
}

export interface ZostelProfile {
  email: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  mobile: string;
  mobile_country_code: string;
  code: string;
  date_joined: string;
  status: string;
  email_verified: boolean;
  mobile_verified: boolean;
  is_deleted: boolean;
  assets: ZostelProfileAsset[];
  socials: GeneralObject[];
  avatar_url: string;
  subdomain: string;
  experience: number;
  level: number;
  level_percent: number;
  tags: string[];
  nickname: string;
  lobby_name: string;
  bio: string | null;
  gender: string;
  relationship_status: string | null;
  work_role: string | null;
  address: string | null;
  date_of_birth: string;
  security: number | null;
  description: string | null;
  speakability: number | null;
  background_key: string | null;
  music_key: string | null;
  media: GeneralObject;
  pincode: string | null;
  time_create: string;
  time_update: string;
  country_citizen: number | null;
  hometown: null | string;
  country_residing: null | string;
  city: null | string;
}
