/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  trailingSlash: true,  // Add trailing slashes to improve compatibility with static hosting
};

module.exports = nextConfig;