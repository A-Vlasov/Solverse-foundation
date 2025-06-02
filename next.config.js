/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Allow importing from src directory
  webpack(config) {
    config.resolve.modules.push('./src');
    return config;
  },
};

module.exports = nextConfig; 