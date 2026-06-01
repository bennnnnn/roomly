# Performance budgets

Budgets are enforced by the quality gate where measurable, and reviewed per slice where not yet automated. Bumping a budget requires an ADR.

## Mobile cold start

- **<3.0 s** from app icon tap to first interactive paint on a 2022 mid-tier device (e.g. iPhone 12, Pixel 6).
- Measured via Sentry "App Start" span and EAS build size check.

## Mobile screen budgets

| Surface              | First paint | Notes                                                     |
| -------------------- | ----------- | --------------------------------------------------------- |
| Browse feed          | <1.5 s      | Cache-first; Realtime hydrates                            |
| Listing detail       | <800 ms     | Photos lazy; description streams                          |
| Chat thread open     | <500 ms     | Cache-first; one RPC for peer context                     |
| Chat send (perceived)| <100 ms     | Optimistic                                                |

## Round-trip budgets per intent

| Intent                  | Budget           | Notes                                                |
| ----------------------- | ---------------- | ---------------------------------------------------- |
| Discover page           | 1 RT             | Single SECURITY DEFINER RPC                          |
| Like / unlike           | 1 RT             | Single RPC returns inserted + matched                |
| Send message            | 2 RT (incl. notify) | DB trigger enforces block / accepts_messages       |
| Chat cold open          | ≤6 RT            | Includes peer context, messages, reactions, mark-read|
| Photo upload (per file) | parallelizable, but each file ≤2 RT |                                |

## Bundle size

- Mobile JS bundle <4 MB (post-Hermes), reviewed per slice.
- Admin route handler cold start <300 ms p95.

## How to handle a budget regression

1. Reproduce locally and capture a profile.
2. If you can fix without changing the public API, fix and add a perf test.
3. If the regression is intentional (e.g. a new feature), open an ADR that revises the budget with the trade-off explained.
