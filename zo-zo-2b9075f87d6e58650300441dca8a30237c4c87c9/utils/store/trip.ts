import { createStore, useStore } from "zustand";

import { ZoServerGuest } from "@/definitions/trip";
import { useCallback, useMemo } from "react";

type TripStateType = {
  guest: ZoServerGuest[];
};

type TripState = {
  state: TripStateType;
};

type SetTripState = { setTripState: (state: TripStateType) => void };

const initState: TripStateType = {
  guest: [],
};

type TripStore = TripState & SetTripState;

const tripStore = createStore<TripStore>()((set) => ({
  state: initState,
  setTripState: (state: TripStateType) => set({ state }),
}));

export default tripStore;

export const useTripStore = () => {
  const state = useStore(tripStore, (state) => state.state);
  const setTripState = useStore(tripStore, (state) => state.setTripState);

  return useMemo(() => ({ state, setTripState }), [state, setTripState]);
};

export const useTripState = () => {
  const state = useStore(tripStore, (state) => state.state);
  return state;
};

export const useTripSetState = () => {
  const setTripState = useStore(tripStore, (state) => state.setTripState);
  return setTripState;
};

export const useTripResetState = () => {
  const setTripState = useTripSetState();
  const reset = useCallback(() => {
    setTripState({ ...initState });
  }, [setTripState]);
  return reset;
};
