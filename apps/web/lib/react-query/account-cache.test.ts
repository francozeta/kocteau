import assert from "node:assert/strict";
import { test } from "node:test";
import { isCancelledError } from "@tanstack/react-query";
import { createAccountQueryCache } from "./account-cache";

test("account cache reuses the current account and replaces it for another account or guest", () => {
  const cache = createAccountQueryCache();
  const first = cache.get("listener-a");
  first.setQueryData(["viewer", "saved-reviews"], ["private-a"]);
  first.setQueryData(["feed", "infinite", "latest"], { viewer_has_liked: true });
  assert.equal(cache.get("listener-a"), first);

  const second = cache.get("listener-b");
  assert.notEqual(second, first);
  assert.equal(first.getQueryCache().getAll().length, 0);
  assert.equal(second.getQueryData(["viewer", "saved-reviews"]), undefined);
  assert.equal(second.getQueryData(["feed", "infinite", "latest"]), undefined);
  second.setQueryData(["viewer", "saved-reviews"], ["private-b"]);

  const guest = cache.get(null);
  assert.notEqual(guest, second);
  assert.equal(second.getQueryCache().getAll().length, 0);
  assert.equal(guest.getQueryData(["viewer", "saved-reviews"]), undefined);
  assert.notEqual(cache.get("listener-a"), first);
  cache.clear();
});

test("an account transition aborts an in-flight read and late completion cannot fill the next cache", async () => {
  const cache = createAccountQueryCache();
  const first = cache.get("listener-a");
  let aborted = false;
  let complete!: (value: string[]) => void;
  const pending = first.fetchQuery({
    queryKey: ["viewer", "saved-reviews"],
    gcTime: Infinity,
    queryFn: ({ signal }) => new Promise<string[]>((resolve) => {
      complete = resolve;
      signal.addEventListener("abort", () => { aborted = true; });
    }),
  }).catch((error: unknown) => error);

  const second = cache.get("listener-b");
  assert.equal(aborted, true);
  complete(["private-a"]);
  assert.equal(isCancelledError(await pending), true);
  assert.equal(second.getQueryData(["viewer", "saved-reviews"]), undefined);
  cache.clear();
});

test("a late mutation callback retains only the abandoned client", async () => {
  const cache = createAccountQueryCache();
  const first = cache.get("listener-a");
  let complete!: (value: boolean) => void;
  let started!: () => void;
  const ready = new Promise<void>((resolve) => { started = resolve; });
  const mutation = first.getMutationCache().build(first, {
    gcTime: Infinity,
    mutationFn: () => new Promise<boolean>((resolve) => { complete = resolve; started(); }),
    onSuccess: (liked) => { first.setQueryData(["viewer", "reviews", "42", "like"], liked); },
  });
  const pending = mutation.execute(undefined);
  await ready;
  const second = cache.get("listener-b");
  complete(true);
  await pending;
  assert.equal(second.getQueryData(["viewer", "reviews", "42", "like"]), undefined);
  first.clear();
  cache.clear();
});
