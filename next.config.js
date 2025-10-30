/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pehla section: Rewrites
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // --- YAHAN BADLAAV KIYA GAYA HAI ---
        // Humne /api ko destination URL mein wapas jod diya hai
        destination: 'https://myedupanel.onrender.com/api/:path*', 
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