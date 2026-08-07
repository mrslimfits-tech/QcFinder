/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Product/QC images live on 1688 and on each agent's own CDN.
    // Add the real CDN hostnames here as you confirm them per agent.
    remotePatterns: [
      { protocol: "https", hostname: "**.alicdn.com" },
      { protocol: "https", hostname: "**.hipobuy.com" },
      { protocol: "https", hostname: "**.mulebuy.com" },
      { protocol: "https", hostname: "**.cnfans.com" }
    ]
  }
};

export default nextConfig;
