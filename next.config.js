/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'pexels.com',
      },
    ],
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
    optimizePackageImports: ['@supabase/ssr'],
  },
}

module.exports = nextConfig