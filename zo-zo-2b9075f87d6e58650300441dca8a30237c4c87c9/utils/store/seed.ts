import { ApplicationSeed } from "@/definitions/auth";
import { create, createStore, useStore } from "zustand";

type SeedStore = {
  seed: ApplicationSeed | null;
  setSeed: (seed: ApplicationSeed) => void;
};

const useSeedStore = create<SeedStore>((set) => ({
  seed: null,
  setSeed: (seed: ApplicationSeed) => set({ seed }),
}));

const useSeed = () => useSeedStore((state) => state.seed);
export const setSeed = (seed: ApplicationSeed) => useSeedStore.setState({ seed });

export const useSeedData = <T extends keyof ApplicationSeed>(key: T) =>
  useSeedStore((state) => state.seed?.[key]) as null | ApplicationSeed[T];

export default useSeed;
