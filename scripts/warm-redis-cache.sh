#!/bin/bash
# Doorli Redis Cache Warming Script
# Warms up frequently accessed cache keys on service startup or deployment.

set -euo pipefail

REDIS_URL="${REDIS_URL:-redis://localhost:6379}"

echo "[warm-redis] Connecting to Redis at ${REDIS_URL}"

# Warm nearby vendor cache
redis-cli -u "${REDIS_URL}" EVAL "
  local keys = redis.call('KEYS', 'nearby:*')
  if #keys > 0 then
    for _, k in ipairs(keys) do
      redis.call('EXPIRE', k, 300)
    end
    return 'warmed ' .. #keys .. ' nearby keys'
  else
    return 'no nearby keys to warm'
  end
" 0

# Warm feature flags cache
redis-cli -u "${REDIS_URL}" EVAL "
  local key = 'doorli:features'
  redis.call('SET', key, 'warm', 'EX', 60)
  return 'warmed feature cache'
" 0

# Warm driver location cache
redis-cli -u "${REDIS_URL}" EVAL "
  local keys = redis.call('KEYS', 'driver:location:*')
  if #keys > 0 then
    for _, k in ipairs(keys) do
      redis.call('EXPIRE', k, 300)
    end
    return 'warmed ' .. #keys .. ' driver location keys'
  else
    return 'no driver location keys to warm'
  end
" 0

echo "[warm-redis] Cache warming complete"