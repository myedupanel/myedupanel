/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pehla section: Rewrites
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/:path*', // Aapka backend server ka address
      },
    ];
  },

  // Doosra section: Images (isi object ke andar)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;