/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["images.unsplash.com"],
  },
  // The cuisine explorer was replaced by the menu on the home page.
  async redirects() {
    return [{ source: "/explore", destination: "/", permanent: false }];
  },
};

export default nextConfig;
