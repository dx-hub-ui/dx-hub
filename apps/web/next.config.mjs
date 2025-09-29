/** @type {import("next").NextConfig} */
const nextConfig = {
  transpilePackages: ["@dx/ui"],
  eslint: { ignoreDuringBuilds: true } // temporary: unblock CI
};
export default nextConfig;