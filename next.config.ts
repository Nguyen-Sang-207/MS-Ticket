import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from Cloudinary and other common sources
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "wsrv.nl" },
      { protocol: "https", hostname: "api.qrserver.com" },
    ],
    unoptimized: true,
  },
  // Required for firebase-admin to work in Next.js serverless
  serverExternalPackages: ["firebase-admin"],
  // Allow cloudinary on server actions
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
