import { QueryClient } from "@tanstack/react-query";
import { kocteauReactQueryDefaultOptions } from "@kocteau/config";

let queryClient: QueryClient | undefined;

export function getQueryClient() {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: kocteauReactQueryDefaultOptions,
    });
  }

  return queryClient;
}
