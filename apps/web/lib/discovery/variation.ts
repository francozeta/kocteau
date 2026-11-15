export function discoveryUnit(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  }
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 4_294_967_296;
}

// A bounded variant is stable within a frame and survives Back/reload. New
// explorations can draw another neighborhood without constantly shuffling it.
export function frameVariation(frameId: string) {
  return Math.floor(discoveryUnit(frameId) * 16);
}
