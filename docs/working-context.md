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

## Context That Survives A Handoff

Keep the entry context small. Read the root contracts, then the owning flow and
only the references required by the task. Use direct file search and existing
commands before adding another retrieval layer. Load relevant skills through
[the project index](../.agents/README.md), rather than every available guide.

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
