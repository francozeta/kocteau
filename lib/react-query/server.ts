import { QueryClient } from "@tanstack/react-query";
import { reactQueryDefaultOptions } from "@/lib/react-query/default-options";

export function createServerQueryClient() {
  return new QueryClient({
    defaultOptions: reactQueryDefaultOptions,
  });
}
