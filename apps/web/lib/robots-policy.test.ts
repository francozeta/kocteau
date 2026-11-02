import assert from "node:assert/strict";
import { describe, it } from "node:test";
import robots from "../app/robots";

function rulesFor(userAgent: string) {
  const rules = robots().rules;
  assert.ok(Array.isArray(rules));
  const rule = rules.find((candidate) =>
    Array.isArray(candidate.userAgent)
      ? candidate.userAgent.includes(userAgent)
      : candidate.userAgent === userAgent,
  );
  assert.ok(rule, `missing robots rule for ${userAgent}`);
  return rule;
}

function paths(value: string | string[] | undefined) {
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}

describe("public robots policy", () => {
  it("allows discovery assistants to read public routes without private app access", () => {
    for (const userAgent of [
      "ChatGPT-User",
      "OAI-SearchBot",
      "Claude-SearchBot",
      "PerplexityBot",
    ]) {
      const rule = rulesFor(userAgent);
      assert.ok(paths(rule.allow).includes("/"));
      for (const pathname of ["/login", "/feed", "/studio", "/api/"]) {
        assert.ok(paths(rule.disallow).includes(pathname));
      }
    }
  });

  it("keeps training-oriented crawlers restricted", () => {
    for (const userAgent of ["GPTBot", "ClaudeBot", "CCBot"]) {
      const rule = rulesFor(userAgent);
      assert.ok(paths(rule.disallow).includes("/"));
      assert.ok(paths(rule.allow).includes("/llms.txt"));
    }
  });

  it("does not weaken the default restrictions for all bots", () => {
    const rule = rulesFor("*");
    assert.ok(paths(rule.allow).includes("/"));
    assert.ok(paths(rule.disallow).includes("/settings"));
    assert.ok(paths(rule.disallow).includes("/auth/"));
  });
});
