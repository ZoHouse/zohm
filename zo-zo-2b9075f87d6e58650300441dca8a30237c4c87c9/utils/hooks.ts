import { useCallback, useEffect, useRef, useState } from "react";

export const useReactiveRef = <T>(initialValue: T) => {
  const ref = useRef<T>(initialValue);

  useEffect(() => {
    ref.current = initialValue;
  }, [initialValue]);

  return ref;
};

export const useToggleState = (initialValue: boolean) => {
  const [state, setState] = useState(initialValue);

  const toggle = useCallback(() => {
    setState((prev) => !prev);
  }, []);

  return [state, toggle] as const;
};
