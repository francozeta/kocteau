"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

export type DetailHeaderState = {
  kind: "track" | "profile";
  title: string;
  shareLabel: string;
  sharePath: string;
  externalLinks: Array<{
    label: string;
    url: string;
  }>;
} | null;

type RouteHeaderContextValue = {
  detailHeader: DetailHeaderState;
  setDetailHeader: Dispatch<SetStateAction<DetailHeaderState>>;
};

const RouteHeaderContext = createContext<RouteHeaderContextValue | null>(null);

export function RouteHeaderProvider({ children }: { children: ReactNode }) {
  const [detailHeader, setDetailHeader] = useState<DetailHeaderState>(null);

  const value = useMemo(
    () => ({
      detailHeader,
      setDetailHeader,
    }),
    [detailHeader],
  );

  return (
    <RouteHeaderContext.Provider value={value}>
      {children}
    </RouteHeaderContext.Provider>
  );
}

export function useRouteHeader() {
  const context = useContext(RouteHeaderContext);

  if (!context) {
    throw new Error("useRouteHeader must be used within RouteHeaderProvider.");
  }

  return context;
}
