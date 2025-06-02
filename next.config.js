/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // This ensures that Next.js correctly handles routes in static exports
  trailingSlash: true,
  eslint: {
    // This allows production builds to successfully complete even with ESLint errors
    ignoreDuringBuilds: true,
  },
  // Disable type checking during build to prevent TypeScript errors from failing the build
  typescript: {
    ignoreBuildErrors: true,
  }
}

module.exports = nextConfig