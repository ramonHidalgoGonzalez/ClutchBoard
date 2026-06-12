import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "media.valorant-api.com" },
      { protocol: "https", hostname: "valorant-api.com" },
      { protocol: "https", hostname: "cdn.valorant-api.com" },
    ],
  },
};

export default nextConfig;
