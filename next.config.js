/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly set the project root
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  env: {
    DISABLE_REALTIME: 'true', // Flag to disable Socket.IO features
  }
};

export default nextConfig;