"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface ProgressContextValue {
  start: () => void;
  done: () => void;
  visible: boolean;
  value: number;
}

const ProgressContext = createContext<ProgressContextValue>({
  start: () => {},
  done: () => {},
  visible: false,
  value: 0,
});

export function useProgress(): ProgressContextValue {
  return useContext(ProgressContext);
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const finishingRef = useRef(false);

  const stop = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const start = useCallback(() => {
    stop();
    finishingRef.current = false;
    setValue(12);
    setVisible(true);
    const tick = () => {
      setValue((prev) => {
        if (finishingRef.current) return prev;
        return prev >= 90 ? 90 : prev + (90 - prev) * 0.18;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const done = useCallback(() => {
    finishingRef.current = true;
    setValue(100);
    const timer = setTimeout(() => {
      setVisible(false);
      setValue(0);
    }, 250);
    rafRef.current = null;
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => stop, []);

  return (
    <ProgressContext.Provider value={{ start, done, visible, value }}>
      {children}
    </ProgressContext.Provider>
  );
}
