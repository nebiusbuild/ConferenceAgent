import IORedis from 'ioredis'

const getRedisUrl = () => {
  if (process.env.REDIS_URL) return process.env.REDIS_URL
  return 'redis://localhost:6379'
}

let _redis: IORedis | null = null

export function getRedis(): IORedis {
  if (!_redis) {
    _redis = new IORedis(getRedisUrl(), {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    })
  }
  return _redis
}

// Lazy proxy — only connects when actually used at runtime, not at import/build time
export const redis = new Proxy({} as IORedis, {
  get(_target, prop) {
    return (getRedis() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
