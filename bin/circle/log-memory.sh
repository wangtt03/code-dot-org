#!/bin/bash
FILE="${CIRCLE_ARTIFACTS:-.}/memory-usage-actual.txt"
echo "Logging to $FILE..."
TIMEFMT='[%Y-%m-%d %H:%M:%S]'
free | ts "$TIMEFMT" | head -n 2 > $FILE;
while true; do
  sleep 10;
  free | ts "$TIMEFMT" | sed -n 2p >> $FILE;
done &
