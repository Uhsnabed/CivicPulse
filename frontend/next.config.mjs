
/** @type {import('next').NextConfig} */

const backendUrl = "https://civicpulse-api-acun.onrender.com";

const nextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
