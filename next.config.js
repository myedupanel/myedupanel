/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pehla section: Rewrites
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // --- YAHAN BADLAAV KIYA GAYA HAI ---
        destination: 'https://myedupanel.onrender.com/:path*', // Aapka naya live backend address
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