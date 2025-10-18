import { createStore, useStore } from "zustand";

type FootStore = {
  footVisible: boolean;
  feedLoaded: boolean;
  setFootVisible: (visible: boolean) => void;
  setFeedLoaded: (feedLoaded: boolean) => void;
};

const footStore = createStore<FootStore>()((set) => ({
  footVisible: false,
  feedLoaded: false,
  setFootVisible: (footVisible: boolean) => set({ footVisible }),
  setFeedLoaded: (feedLoaded: boolean) => set({ feedLoaded }),
}));

export default footStore;

export const useSetFootStore = () => {
  return useStore(footStore, (state) => state.setFootVisible);
};

export const useFootStore = () => {
  return useStore(footStore, (state) => state.footVisible);
};

export const useFeedLoaded = () => {
  return useStore(footStore, (state) => state.feedLoaded);
};

export const useSetFeedLoaded = () => {
  return useStore(footStore, (state) => state.setFeedLoaded);
};
