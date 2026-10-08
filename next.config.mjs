/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  async rewrites() {
    const backendUrl = (
      process.env.BACKEND_URL || 'https://api.management.phidimservice.com.np'
    ).replace(/\/$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
