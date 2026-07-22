import type { DefaultOptions } from "@tanstack/react-query";

export const reactQueryDefaultOptions: DefaultOptions = {
  queries: {
    staleTime: 60_000,
    gcTime: 15 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  },
  mutations: {
    retry: 0,
  },
};
