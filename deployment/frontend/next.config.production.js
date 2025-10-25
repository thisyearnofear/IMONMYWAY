/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production config for Netlify deployment
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
    // Point to your Hetzner backend
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || "https://157.180.36.156:3001",
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "https://157.180.36.156:3001",
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || "https://your-netlify-app.netlify.app",
  }
};

export default nextConfig;