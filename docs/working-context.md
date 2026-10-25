# Working Context

## Enter

Read [AGENTS.md](../AGENTS.md) and [CURRENT.md](../CURRENT.md). Open the relevant
[flow README](./components.md) and its linked technical guide. Inspect Git status,
recent commits, and the coordinating issue or PR before changing files.

## Plan And Prioritize

Capture actionable improvements and future product hypotheses in GitHub issues
before implementation. Include the user problem, existing behavior, sources,
smallest scope, dependencies, priority and a verifiable acceptance condition.
For uncertain experiments, record what would lead to keeping, revising or
dropping the idea. Link related issues rather than duplicating an existing scope.

The connected Linear workspace imports GitHub issues. Organize those imported
items by project, priority and status; link implementation PRs and evidence back
to the issue. Do not create a second ticket for the same imported work or mark
a local result as shipped. Current product hypotheses are indexed in
[the discovery backlog](https://github.com/francozeta/kocteau/issues/251);
[the performance tracker](https://github.com/francozeta/kocteau/issues/147)
orders the active home/feed work.

## Change

Keep one task on one conventional branch. Record only decisions that will matter
to the next contributor:

| Information | Put it here |
| --- | --- |
| Product behavior and scope | [PRODUCT.md](../PRODUCT.md) |
| Visual and interaction rules | [DESIGN.md](../DESIGN.md) |
| Entry points, invariants, flow checks | README beside the components |
| Schema, API, or operational contract | Owning [technical guide](./README.md) |
| Current status, blocker, next priority | [CURRENT.md](../CURRENT.md) |
| Multi-step handoff not yet implemented | [Shared plan](../.plan/README.md), linked to its issue/PR |

Edit the owning document alongside the code. Link to stable rules instead of
copying them. Scratch output stays in ignored local directories.

## Context That Survives A Handoff

The [repository contract](../AGENTS.md#source-of-truth) owns context-gathering rules;
[the project index](../.agents/README.md) routes relevant skills.

Use these fields when recording meaningful work in CURRENT.md or a shared plan:

| Field | Evidence to retain |
| --- | --- |
| Outcome | User-visible behavior and a concrete acceptance condition |
| Baseline | Branch, commit, and integrated versus local or in-review state |
| Finding | Trigger, observed failure, impact, and owning file or flow |
| Decision | Chosen approach and the constraint that made it useful |
| Verification | Command or flow, result, date, and local versus deployed environment |
| Limits | Unexercised auth/role/data states and unresolved deployment or schema differences |
| Next action | Smallest remaining step and any required input or authorization |

Retain reproduced defects separately from hypotheses. A command without its
result is not evidence; a remembered deployment state needs rechecking. Avoid
copying logs, private values, and unchanged history into the handoff.

Validate workflow changes on representative work: finding a flow, reproducing a
defect, and handing the result to a fresh checkout. Compare correctness, missing
context, repeated reads, and time spent before claiming an efficiency gain.

## Verify

Use [contribution checks](../CONTRIBUTING.md#verification). State what passed and
what the available environment could not exercise. A successful build does not
verify OTP delivery, RLS, or a real curator session.

## Hand Off

Before a commit or device change, reconcile CURRENT.md with the diff and issue/PR
evidence. Leave the branch, verification caveats, blocker, and next action clear.
On the next machine, follow [returning-device setup](./setup/local-development.md).

Keep this cycle small. A completed task should leave working code and the context
needed to change it again.
