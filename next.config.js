/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '') || '*.supabase.co'
    ],
  },
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
}

module.exports = nextConfig