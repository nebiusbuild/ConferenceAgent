/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['bullmq', 'ioredis', 'twilio', 'googleapis'],
  },
}

module.exports = nextConfig
