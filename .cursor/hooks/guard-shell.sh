#!/bin/bash
# guard-shell.sh — block dangerous shell commands.
# failClosed=true in hooks.json: any non-zero/invalid response blocks the command.
#
# Matches against the command with quoted strings and heredoc bodies stripped,
# so a forbidden token (e.g. --no-verify) appearing inside a commit message
# body does NOT trigger a false-positive block.
#
# Blocks:
#   * git commit / push / merge / rebase with --no-verify, -n, --no-gpg-sign
#   * git push --force / -f to main, master, prod, production, release branches
#   * rm -rf / or rm -rf ~ (and equivalents)
#   * curl ... | sh (and wget | sh / bash) — opaque remote execution
#   * Direct psql against Supabase remote URL (must go through MCP)
#   * supabase db reset --linked (touches remote)
#   * pnpm publish / npm publish (not part of Roomly workflow)
#
# Asks (does not block) for:
#   * Any rm -rf with a path argument
#   * Anything with sudo
#   * Any git push --force/--force-with-lease/-f to a non-protected branch
#   * In-place edits to supabase/migrations/ files

set -euo pipefail

input=$(cat)
command=$(echo "$input" | jq -r '.command // empty')

if [[ -z "$command" ]]; then
  echo '{"permission":"allow"}'
  exit 0
fi

# Strip quoted strings + heredoc bodies so we only match real CLI tokens.
# Falls back to the raw command if python3 is unavailable.
if command -v python3 >/dev/null 2>&1; then
  cleaned=$(printf '%s' "$command" | python3 -c '
import sys, re
s = sys.stdin.read()
# Strip heredoc bodies: <<TAG ... TAG  and  <<"TAG" ... TAG  and  <<\x27TAG\x27 ... TAG
def strip_heredoc(text):
    out, i, n = [], 0, len(text)
    while i < n:
        m = re.search(r"<<-?\s*([\x27\x22]?)(\w+)\1", text[i:])
        if not m:
            out.append(text[i:])
            break
        out.append(text[i:i+m.end()])
        tag = m.group(2)
        i += m.end()
        end = re.search(r"\n\s*" + re.escape(tag) + r"\b", text[i:])
        if end:
            i += end.end()
        else:
            break
    return "".join(out)
s = strip_heredoc(s)
# Strip single- and double-quoted strings (good enough for first-pass; no nested escapes)
s = re.sub(r"\x27[^\x27]*\x27", " ", s)
s = re.sub(r"\x22[^\x22]*\x22", " ", s)
sys.stdout.write(s)
')
else
  cleaned="$command"
fi

deny() {
  jq -n --arg m "$1" '{
    permission: "deny",
    user_message: $m,
    agent_message: ("BLOCKED by .cursor/hooks/guard-shell.sh: " + $m + ". Adjust the command or escalate to the user if intentional.")
  }'
  exit 0
}

ask() {
  jq -n --arg m "$1" '{
    permission: "ask",
    user_message: $m,
    agent_message: ("Hook flagged: " + $m)
  }'
  exit 0
}

# --- HARD BLOCKS (match against cleaned command, per-segment for verb-scoped flags) ---

# Split cleaned command into segments on &&, ||, ;, | so we can check flags per subcommand.
# Portable to macOS bash 3.2 (no mapfile).
segments=()
while IFS= read -r line; do
  [[ -n "$line" ]] && segments+=("$line")
done < <(printf '%s' "$cleaned" | awk '{ gsub(/\|\||&&|;|\|/, "\n"); print }')

for seg in "${segments[@]}"; do
  # Bypass commit hooks via long flags (any git subcommand that supports them)
  if [[ "$seg" =~ git[[:space:]]+(commit|push|merge|rebase) ]] \
     && [[ "$seg" =~ (^|[[:space:]])(--no-verify|--no-gpg-sign)([[:space:]]|$) ]]; then
    deny "Bypassing git hooks (--no-verify / --no-gpg-sign) is forbidden. The quality gate must run."
  fi
  # Short form -n only matters on `git commit`; on other commands it means line-count etc.
  if [[ "$seg" =~ git[[:space:]]+commit ]] && [[ "$seg" =~ (^|[[:space:]])-n([[:space:]]|$) ]]; then
    deny "git commit -n bypasses commit hooks. Forbidden."
  fi
  # Force push to protected branches
  if [[ "$seg" =~ git[[:space:]]+push ]] \
     && [[ "$seg" =~ (--force|--force-with-lease|(^|[[:space:]])-f([[:space:]]|$)) ]] \
     && [[ "$seg" =~ (main|master|prod|production|release) ]]; then
    deny "Force-pushing to a protected branch (main/master/prod/production/release) is forbidden."
  fi
done

# rm -rf / or rm -rf ~ (and obvious variants)
if [[ "$cleaned" =~ rm[[:space:]]+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r|-rf|-fr)[[:space:]]+(/|~|\$HOME)([[:space:]]|$) ]]; then
  deny "rm -rf against / or \$HOME is destructive and forbidden."
fi

# Pipe-to-shell from network
if [[ "$cleaned" =~ (curl|wget)[[:space:]].*\|[[:space:]]*(sh|bash|zsh) ]]; then
  deny "Piping network output directly into a shell is forbidden (supply-chain risk). Download, inspect, then run."
fi

# psql against a Supabase remote
if [[ "$cleaned" =~ psql.*supabase\.(co|com) ]]; then
  deny "Direct psql against a Supabase remote is forbidden. Use the plugin-supabase-supabase MCP apply_migration / execute_sql instead."
fi

# Reset linked (remote) database
if [[ "$cleaned" =~ supabase[[:space:]]+db[[:space:]]+reset.*--linked ]]; then
  deny "supabase db reset --linked wipes the remote database. Forbidden."
fi

# Publishing packages — not ready
if [[ "$cleaned" =~ (^|[[:space:]])(pnpm|npm|yarn)[[:space:]]+publish ]]; then
  deny "Package publishing is not part of Roomly's workflow. If you really mean it, ask the user."
fi

# --- SOFT GATES (ask the user) ---

if [[ "$cleaned" =~ (^|[[:space:]])sudo[[:space:]] ]]; then
  ask "This command uses sudo. Confirm it is intentional."
fi

if [[ "$cleaned" =~ rm[[:space:]]+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r|-rf|-fr)[[:space:]]+[^[:space:]]+ ]]; then
  ask "Recursive removal — confirm the target path is safe."
fi

for seg in "${segments[@]}"; do
  if [[ "$seg" =~ git[[:space:]]+push ]] \
     && [[ "$seg" =~ (--force|--force-with-lease|(^|[[:space:]])-f([[:space:]]|$)) ]]; then
    ask "Force push detected. Confirm the branch and that nobody else has based work on it."
  fi
done

if [[ "$cleaned" =~ (sed|awk|cat[[:space:]]+\>).*supabase/migrations ]]; then
  ask "Editing supabase/migrations/ files in place — write a new migration unless this file has never been applied."
fi

echo '{"permission":"allow"}'
exit 0
