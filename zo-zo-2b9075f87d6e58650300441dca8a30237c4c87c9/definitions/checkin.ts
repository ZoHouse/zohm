export interface CheckinRequest {
  booking_code?: string;
  arrival_time: string;
  next_destination: string;
  coming_from: string;
  arrival_on?: string;
  departure_on?: string;
  email_address: string;
}

export type CheckinFormStates = "info_edit" | "id_edit" | "time" | "done";

export type AssetMedia = {
  path: string;
  name?: string;
  size?: number;
  mime?: string;
};

export type IDState = {
  front: AssetMedia | undefined;
  back: AssetMedia | undefined;
  side: "front" | "back";
  source: "camera" | "gallery";
  isUploading: boolean;
  isUsingCamera: boolean;
  isPreviewing: boolean;
};

export type MediaStatus = {
  document_type: {
    id: number;
    name: string;
    requires_back: boolean;
    slug: string;
  } | null;
  identifier: string | null;
  key: string;
  status: "Pending" | "Processing" | "Validated" | "Failed";
  time_update: string;
  type: "Document Front" | "Document Back";
  validation_error: string | null;
  validation_status: number;
};
