#!/bin/bash
set -xe

yarn clear:all

echo "" | hc s --piped create --num-sandboxes 1 --root ./test --directories test-agent network webrtc ws://127.0.0.1:11223
echo "" | hc s --piped -f=8888 run &
HC_ID=$!
echo "HC_ID is $HC_ID"
# give time for the conductor setup to complete
sleep 5 

set +e

yarn api:test

pkill -15 -P $HC_ID
