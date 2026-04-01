import { getKocteauTheme } from "@kocteau/config";
import { useColorScheme } from "@/hooks/use-color-scheme";

export function useKocteauTheme() {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  return getKocteauTheme(scheme);
}
