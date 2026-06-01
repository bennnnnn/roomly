#!/bin/bash
# audit-mcp.sh — append every MCP tool call to .cursor/logs/mcp-audit.log.
# Never blocks; always allows. Used for after-the-fact review.

set -euo pipefail

input=$(cat)
log_dir=".cursor/logs"
mkdir -p "$log_dir"

ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
tool_name=$(echo "$input" | jq -r '.tool_name // .tool // "unknown"')
server=$(echo "$input" | jq -r '.server // .mcp_server // "unknown"')
summary=$(echo "$input" | jq -c '.tool_input // .arguments // {}' | head -c 500)

printf '%s\t%s\t%s\t%s\n' "$ts" "$server" "$tool_name" "$summary" >> "$log_dir/mcp-audit.log"

echo '{"permission":"allow"}'
exit 0
