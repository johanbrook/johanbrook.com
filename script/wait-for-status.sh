#!/usr/bin/env bash
#
# Waits for a give note to be deployed at johan.im
#
# Usage:
# ./script/wait-for-status.sh <path to note>
# ./script/wait-for-status.sh --latest

ENDPOINT="https://johan.im/status.json"
DIR="src/notes"

file_path="$1"

if [ -z "$file_path" ]; then
    echo "Usage: script/wait-for-status.sh <path> | --latest"
    exit 1
fi

if [ "$file_path" == "--latest" ]; then
    file_path=$(ls -r1 "$DIR" | grep -v "_" | head -n 1)
else
    file_path=$(basename "$file_path")
fi

# 2022-01-04-09-37.md -> 202201040937
file_id=$(echo "$file_path" | sed -e "s/-//g" | cut -f 1 -d ".")

while true; do
    deployed=$(curl -s "$ENDPOINT" | jq -r ".micro")
    is_deployed=$([ "$deployed" = "$file_id" ] && echo true || echo false)

    echo "$([ "$is_deployed" = true ] && echo "✅" || echo "🕣") [$(date -u)] Deployed: $deployed $([ "$is_deployed" = true ] && echo "==" || echo "!=") Latest: $file_id"

    if [ "$is_deployed" = true ]; then
        break
    fi

    sleep 2
done
