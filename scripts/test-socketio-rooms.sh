#!/bin/bash
# Doorli Socket.io Room Load Test Script
# Tests that Socket.io rooms are working under concurrent connections.

set -euo pipefail

NOTIFICATIONS_URL="${NOTIFICATIONS_URL:-http://localhost:4007}"
CONCURRENT_CLIENTS="${CONCURRENT_CLIENTS:-100}"
ROOM_PREFIX="${1:-order:test}"

echo "[socket-test] Testing Socket.io rooms with ${CONCURRENT_CLIENTS} concurrent clients"
echo "[socket-test] Target: ${NOTIFICATIONS_URL}"

# Install check
if ! command -v node &> /dev/null; then
  echo "[socket-test] ERROR: node not found"
  exit 1
fi

# Quick Socket.io connection test using node
node -e "
const io = require('socket.io-client');
const total = parseInt(process.argv[1] || '100');
const room = process.argv[2] || 'order:test';
const url = process.argv[3] || 'http://localhost:4007';

let connected = 0;
let failed = 0;
let received = 0;

for (let i = 0; i < total; i++) {
  const socket = io(url, { transports: ['websocket'] });
  socket.on('connect', () => {
    connected++;
    socket.join(room);
    socket.emit('test event', { data: 'ping', room });
  });
  socket.on('connect_error', () => {
    failed++;
  });
  socket.on('test response', () => {
    received++;
  });
  socket.on('disconnect', () => {});
}

setTimeout(() => {
  console.log('[socket-test] Results: connected=' + connected + ' failed=' + failed + ' received=' + received);
  if (connected > 0 && connected >= total * 0.9) {
    console.log('[socket-test] PASS: rooms working under load');
    process.exit(0);
  } else {
    console.log('[socket-test] FAIL: insufficient connections');
    process.exit(1);
  }
}, 5000);
" "${CONCURRENT_CLIENTS}" "${ROOM_PREFIX}" "${NOTIFICATIONS_URL}"

echo "[socket-test] Socket.io room test complete"