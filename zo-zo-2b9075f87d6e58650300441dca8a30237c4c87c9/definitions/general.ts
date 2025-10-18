export type GeneralObject = {
  [key: string]: any;
};

export interface GooglePlace {
  id: string;
  name: string;
  address: string;
  place_id: string;
}

export type SearchResult<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type ListResult<T> = {
  count: number;
  results: T[];
};

export type Fn = () => void;

export type NonEmpty<T> = [T, ...T[]];
export type AtleastTwo<T> = [T, T, ...T[]];

export interface PickerAsset {
  size: number;
  path: string;
  mime: string;
  filename: string;
}
