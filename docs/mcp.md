# MCP usage in Roomly

We prefer MCP servers over bespoke scripts when the capability overlaps. New MCPs get added here so contributors know they exist.

## In active use

### `plugin-supabase-supabase`

Used for:

- `apply_migration` — every schema change goes through this so it is tracked.
- `execute_sql` — read-only investigation; never for writes.
- `list_tables`, `list_extensions` — exploring the existing schema.
- `get_logs` — debugging without leaving the agent.
- `get_advisors` — security + perf advisors before any PR touching SQL.
- `gen_types_typescript` — regenerate `packages/db-types`.

Forbidden:

- `psql` against any Supabase remote URL — blocked by the `guard-shell.sh` hook.
- `supabase db reset --linked` — would wipe the remote DB; blocked by the hook.

### `cursor-app-control`

Used for:

- `move_agent_to_root` after creating a new project or worktree.
- `create_project` when bootstrapping a new directory.
- `open_resource` to reveal a file/terminal/URL for the user.

### `cursor-backend-control`

Used for Cursor-product workflows only (Automations, etc.). Not for app data.

## Planned

- `plugin-datadog-datadog` — once production observability is wired (Slice 7).

## Adding a new MCP

1. Document it here with the operations we actually call.
2. Note any safety considerations (writes, privacy mode, role).
3. Update `.cursor/hooks/guard-shell.sh` if any related shell command should be gated.
