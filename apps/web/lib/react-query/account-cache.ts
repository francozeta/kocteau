import { QueryClient } from "@tanstack/react-query";
import { reactQueryDefaultOptions } from "./default-options";

export function makeQueryClient() {
  return new QueryClient({ defaultOptions: reactQueryDefaultOptions });
}

// Keep one account in memory, including payloads that mix public and viewer data.
export function createAccountQueryCache() {
  let current: { accountId: string | null; client: QueryClient } | undefined;

  return {
    get(accountId: string | null) {
      if (!current || current.accountId !== accountId) {
        current?.client.clear();
        current = { accountId, client: makeQueryClient() };
      }
      return current.client;
    },
    clear() {
      current?.client.clear();
      current = undefined;
    },
  };
}
