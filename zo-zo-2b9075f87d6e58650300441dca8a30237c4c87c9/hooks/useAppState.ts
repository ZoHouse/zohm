import { useEffect, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

const useAppState = () => {
  const [appState, setAppStateVisible] = useState<AppStateStatus>("active");

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      setAppStateVisible
    );

    return () => subscription.remove();
  }, []);

  return appState;
};

export default useAppState;

export const useIsActiveAppState = () => {
  const [appState, setAppStateVisible] = useState<AppStateStatus>("active");

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      setAppStateVisible
    );

    return () => subscription.remove();
  }, []);

  return appState === "active";
};
