import { useCallback, useState } from "react";

const useVisibilityState: (
  initialState?: boolean
) => [boolean, () => void, () => void] = (initialState = false) => {
  const [visible, setVisible] = useState<boolean>(initialState);

  const show = useCallback(() => {
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
  }, []);

  return [visible, show, hide];
};

export default useVisibilityState;
