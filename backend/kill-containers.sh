#!/bin/bash

echo "=== KILLING ALL HLS CONTAINERS ==="

echo "Current HLS containers:"
docker ps --filter "name=hls-processor"

echo ""
echo "Killing all HLS containers..."
docker ps -q --filter "name=hls-processor" | xargs -r docker rm -f

echo "Killing temp containers..."
docker ps -q --filter "name=temp-copy" | xargs -r docker rm -f

echo ""
echo "Remaining HLS containers:"
docker ps --filter "name=hls-processor"

echo ""
echo "✅ All HLS containers killed!" 