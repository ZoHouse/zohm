type TrackType =
  | "swipe-cards"
  | "3xn-horizontal-list"
  | "standard-horizontal-list"
  | "filter"
  | "banner-logo-text-vertical-list"
  | "banner-logo-text-horizontal-list"
  | "nx3-vertical-list"
  | "capsule-horizontal-list"
  | "portrait-horizontal-list";

export type FeedItem =
  | (Playlist & { _type: "playlist" })
  | { title?: string; subtitle?: string; id: string; _type: "head" };

export interface HomeData {
  id: string;
  title?: string;
  subtitle?: string;
  playlists: Playlist[];
}
[];

export interface DiscoverSection {
  sections: HomeData[];
}

export interface Playlist {
  id: string;
  title?: string;
  subtitle?: string;
  structure: TrackType;
  tags?: {
    slug: string;
    emoji?: string;
  }[];
  tracks: Track[];
}

export interface Track {
  title: string;
  id: string;
  media: string;
  video: string;
  deeplink: string; // zostel://{PAGE_NAME}/{SLUG};

  link?: string;
  media_category_logo?: string;
  category?: string;
  category_color?: string;
  subtitle?: string; // support for \n
  link_text?: string;
  tags?: {
    slug: string;
    emoji?: string;
  }[];
}

export type FilterTracks = Record<string, Track[]>;
