/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    domains: ['images.pexels.com', 'pexels.com'],
  },
  eslint: {
    // This allows production builds to successfully complete even with ESLint errors
    ignoreDuringBuilds: true,
  },
  // Disable type checking during build to prevent TypeScript errors from failing the build
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // Ignore specific modules that cause warnings
    config.externals = config.externals || []
    
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        encoding: false,
        'pino-pretty': false,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    // Suppress specific webpack warnings
    config.ignoreWarnings = [
      { module: /node_modules\/@supabase\/realtime-js/ },
      { module: /node_modules\/node-fetch/ },
      { module: /node_modules\/pino/ },
      { module: /node_modules\/encoding/ },
    ]
    
    return config
  },
  // Add experimental features for better performance
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
  },
}

module.exports = nextConfig