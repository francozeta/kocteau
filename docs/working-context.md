# Working Context

## Enter

Read [AGENTS.md](../AGENTS.md) and [CURRENT.md](../CURRENT.md). Open the relevant
[flow README](./components.md) and its linked technical guide. Inspect Git status,
recent commits, and the coordinating issue or PR before changing files.

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
