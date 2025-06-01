/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // This ensures that Next.js correctly handles routes in static exports
  trailingSlash: true,
}

module.exports = nextConfig