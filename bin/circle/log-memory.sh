#!/bin/bash
TIMEFMT='[%Y-%m-%d %H:%M:%S]'
free | ts "$TIMEFMT" | head -n 2;
while true; do
  sleep 10;
  free | ts "$TIMEFMT" | sed -n 2p;
done
