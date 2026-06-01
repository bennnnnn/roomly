#!/bin/bash
# audit-mcp.sh — log every MCP tool call to .claude/logs/mcp-audit.log.
# Claude Code PreToolUse hook (matcher: "" runs for all tools, we filter for MCP).
# Mirrors .cursor/hooks/audit-mcp.sh
# Never blocks; always allows.

set -euo pipefail

input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool // "unknown"')

# Only log MCP tool calls (tools with "mcp__" prefix in Claude Code)
if [[ ! "$tool_name" =~ ^mcp__ ]]; then
  echo '{"decision":"allow"}'
  exit 0
fi

log_dir=".claude/logs"
mkdir -p "$log_dir"

ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
server=$(echo "$input" | jq -r '.tool_input.server_name // "unknown"')
tool=$(echo "$input" | jq -r '.tool_input.tool_name // "unknown"')
summary=$(echo "$input" | jq -c '.tool_input.arguments // {}' | head -c 500)

printf '%s\t%s\t%s\t%s\n' "$ts" "$server" "$tool" "$summary" >> "$log_dir/mcp-audit.log"

echo '{"decision":"allow"}'
exit 0
