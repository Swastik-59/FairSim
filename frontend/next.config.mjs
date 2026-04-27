const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://fairsim.onrender.com' : 'http://localhost:8000')

const nextConfig = {
  experimental: {
    optimizePackageImports: ['recharts', 'lucide-react', 'framer-motion'],
  },
  headers: async () => {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(js|css|image|font)/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiBaseUrl}/:path*` }]
  },
}

export default nextConfig
