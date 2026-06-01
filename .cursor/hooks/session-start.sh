#!/bin/bash
# Print the required reading reminder at the start of every session.
# Returns additional_context so the agent loads the ground rules before it does anything.

set -euo pipefail

cat <<'JSON'
{
  "additional_context": "Roomly is a PRODUCTION app. Before any task:\n  1. Read AGENTS.md (or CLAUDE.md, the symlinked alias) end-to-end if you haven't this session.\n  2. Re-read the relevant section of docs/PRD.md.\n  3. Re-read docs/lessons-from-prior-codebase.md for the feature area you are touching.\n  4. Web-search official docs (last 6 months) for any SDK API you are about to use.\n  5. Run `pnpm gate` before committing. No --no-verify, no force-push to main, no editing applied migrations in place.\nThe ten ground rules are enforced. See AGENTS.md \u00a70."
}
JSON
