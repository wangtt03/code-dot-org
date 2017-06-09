#!/bin/bash
FILE="${CIRCLE_ARTIFACTS:-.}/memory-usage-${CIRCLE_NODE_INDEX:-0}.txt"
echo "Logging to $FILE..."
TIMEFMT='[%Y-%m-%d %H:%M:%S]'
free | ts "$TIMEFMT" | head -n 2 > $FILE;
while true; do
  sleep 10;
  free | ts "$TIMEFMT" | sed -n 2p >> $FILE;
done &
