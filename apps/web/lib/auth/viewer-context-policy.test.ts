import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isLegacyTasteOnboardedColumnError,
  VIEWER_CONTEXT_READ_BUDGET_MS,
} from "./viewer-context-policy";

test("viewer context read budget is finite", () => {
  assert.ok(VIEWER_CONTEXT_READ_BUDGET_MS > 0);
  assert.ok(VIEWER_CONTEXT_READ_BUDGET_MS <= 5_000);
});

test("only a missing legacy taste column may trigger fallback", () => {
  assert.equal(
    isLegacyTasteOnboardedColumnError({ code: "42703", message: 'column "taste_onboarded" does not exist' }),
    true,
  );
  assert.equal(
    isLegacyTasteOnboardedColumnError({ code: "PGRST204", message: "Could not find taste_onboarded" }),
    true,
  );
  for (const err of [
    { code: "503", message: "upstream unavailable" },
    { code: "PGRST116", message: "no rows" },
    { code: "42703", message: 'column "avatar_url" does not exist' },
    { code: "57014", message: "canceling statement due to statement timeout" },
    { code: "", message: "TimeoutError: Public data read deadline exceeded" },
  ]) assert.equal(isLegacyTasteOnboardedColumnError(err), false);
});
