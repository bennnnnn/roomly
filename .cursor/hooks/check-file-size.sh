#!/bin/bash
# check-file-size.sh — warn when a file edit pushes past the 600-line hard cap
# or the per-type soft target. Returns additional_context so the agent sees the warning.
# Never blocks — ESLint enforces the hard cap on the commit gate.

set -euo pipefail

input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.path // .tool_input.file_path // empty')

if [[ -z "$file_path" || ! -f "$file_path" ]]; then
  echo '{}'
  exit 0
fi

case "$file_path" in
  *.md|*.json|*.lock|*.svg|*.snap|*.test.snap)
    echo '{}'; exit 0;;
esac

lines=$(wc -l < "$file_path" | tr -d ' ')
hard_cap=600
soft_cap=300

case "$file_path" in
  */app/*.tsx|*/app/**/*.tsx)     soft_cap=300; label="screen";;
  */hooks/*.ts|*/use-*.ts)        soft_cap=200; label="hook";;
  */stores/*.ts|*/*.store.ts)     soft_cap=400; label="store";;
  *.sql)                          soft_cap=400; label="SQL";;
  *)                              soft_cap=400; label="module";;
esac

if (( lines > hard_cap )); then
  jq -n --arg p "$file_path" --argjson l "$lines" --argjson c "$hard_cap" '{
    additional_context: ("HARD CAP EXCEEDED: " + $p + " is " + ($l|tostring) + " lines (cap " + ($c|tostring) + "). Split this file before committing — ESLint max-lines will fail the gate.")
  }'
elif (( lines > soft_cap )); then
  jq -n --arg p "$file_path" --argjson l "$lines" --argjson c "$soft_cap" --arg t "$label" '{
    additional_context: ("Soft cap reached: " + $p + " is " + ($l|tostring) + " lines (" + $t + " target " + ($c|tostring) + "). Consider extracting components/hooks now to stay under the 600-line hard cap.")
  }'
else
  echo '{}'
fi
exit 0
