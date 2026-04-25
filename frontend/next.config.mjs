const nextConfig = {
  experimental: {
    optimizePackageImports: ['recharts', 'lucide-react', 'framer-motion'],
  },
  async rewrites() {
    return [{ source: '/api/:path*', destination: 'http://localhost:8000/:path*' }]
  },
}

export default nextConfig
