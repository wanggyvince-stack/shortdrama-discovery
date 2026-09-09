/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    loader: 'custom',
    loaderFile: 'lib/image-loader.ts',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      // wsrv.nl - free image optimization CDN
      {
        protocol: 'https',
        hostname: 'wsrv.nl',
      },
    ],
  },
  async redirects() {
    return [
      // Slug fix: '+' is not URL-safe and returned HTTP 400.
      // Escaped as \+ because '+' is a path-to-regexp modifier.
      { source: '/tag/lgbtq\\+', destination: '/tag/lgbtq', permanent: true },
    ];
  },
};

module.exports = nextConfig;
