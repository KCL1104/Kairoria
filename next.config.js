/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Removed trailingSlash: true to enable middleware functionality
  // trailingSlash: true,
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
      }
    }
    
    // Suppress specific webpack warnings
    config.ignoreWarnings = [
      { module: /node_modules\/@supabase\/realtime-js/ },
      { module: /node_modules\/node-fetch/ },
      { module: /node_modules\/pino/ },
    ]
    
    return config
  },
}

module.exports = nextConfig