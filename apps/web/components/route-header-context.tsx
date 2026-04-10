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

export type TrackHeaderState = {
  title: string;
  artistName: string | null;
  deezerUrl: string | null;
} | null;

type RouteHeaderContextValue = {
  trackHeader: TrackHeaderState;
  setTrackHeader: Dispatch<SetStateAction<TrackHeaderState>>;
};

const RouteHeaderContext = createContext<RouteHeaderContextValue | null>(null);

export function RouteHeaderProvider({ children }: { children: ReactNode }) {
  const [trackHeader, setTrackHeader] = useState<TrackHeaderState>(null);

  const value = useMemo(
    () => ({
      trackHeader,
      setTrackHeader,
    }),
    [trackHeader],
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
