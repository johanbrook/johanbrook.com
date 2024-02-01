#!/usr/bin/env bash
#
# Check whether we've posted the input file path to Mastodon (persisted in $MASTODON_LIST)
#
# Usage:
#
# ./script/check-mastodon-note.sh <path to file>
# ./script/check-mastodon-note.sh --latest
# same as:
# ./script/check-mastodon-note.sh $(ls -r1 "src/notes" | grep -v "_" | head -n 1)

MASTODON_LIST=".mastodon-notes"
DIR="src/notes"

file_path="$1"

if [ "$file_path" == "--latest" ]; then
    file_path=$(ls -r1 "$DIR" | grep -v "_" | head -n 1)
else
    file_path=$(basename "$file_path")
fi

# 2022-01-04-09-37.md -> 202201040937
file_id=$(echo "$file_path" | sed -e "s/-//g" | cut -f 1 -d ".")

case `cat "$MASTODON_LIST" | grep -Fxq "$file_id" >/dev/null; echo $?` in
  0)
    # found
    exit 0
    ;;
  1)
    # not found, continue
    echo "$file_id"
    exit 0
    ;;
  *)
    # error
    echo "An error occurred when checking $MASTODON_LIST for note: $file_id" 1>&2
    exit 1
    ;;
esac
