import IORedis from 'ioredis'

const getRedisUrl = () => {
  if (process.env.REDIS_URL) return process.env.REDIS_URL
  return 'redis://localhost:6379'
}

export const redis = new IORedis(getRedisUrl(), {
  maxRetriesPerRequest: null,
})
