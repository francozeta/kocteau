"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type SetSecondaryRailContent = (content: ReactNode | null) => void;

const SecondaryRailContentContext = createContext<ReactNode | null>(null);
const SecondaryRailSetterContext = createContext<SetSecondaryRailContent | null>(null);

export function SecondaryRailProvider({ children }: { children: ReactNode }) {
  const [content, setRailContent] = useState<ReactNode | null>(null);
  const setContent = useCallback((nextContent: ReactNode | null) => {
    setRailContent(nextContent);
  }, []);

  return (
    <SecondaryRailSetterContext.Provider value={setContent}>
      <SecondaryRailContentContext.Provider value={content}>
        {children}
      </SecondaryRailContentContext.Provider>
    </SecondaryRailSetterContext.Provider>
  );
}

export function useSecondaryRailContent() {
  return useContext(SecondaryRailContentContext);
}

export function useSecondaryRail() {
  const setContent = useContext(SecondaryRailSetterContext);

  return {
    setContent: setContent ?? (() => undefined),
  };
}
