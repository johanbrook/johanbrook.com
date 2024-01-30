#!/usr/bin/env bash
#
# Check whether we've posted the latest note in $DIR to Mastodon (persisted in $MASTODON_LIST)

DIR="src/notes"
MASTODON_LIST=".mastodon-notes"

# 2022-01-04-09-37.md -> 202201040937
LATEST=$(ls -r1 "$DIR" | grep -v "_" | head -n 1 | sed -e "s/-//g" | cut -f 1 -d ".")

echo "Latest note is $LATEST"

case `cat "$MASTODON_LIST" | grep -Fxq "$LATEST" >/dev/null; echo $?` in
  0)
    # found
    echo "Found note $LATEST in $MASTODON_LIST. Do nothing."
    exit 2
    ;;
  1)
    # not found, continue
    echo "Note $LATEST not in $MASTODON_LIST"
    exit 0
    ;;
  *)
    # error
    echo "An error occurred when checking $MASTODON_LIST for note: $LATEST" 1>&2
    exit 1
    ;;
esac
