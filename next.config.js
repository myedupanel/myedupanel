/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pehla section: Rewrites (No Change)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // --- YAHAN BADLAAV KIYA GAYA HAI ---
        // Humne /api ko destination URL mein wapas jod diya hai
        destination: 'https://myedupanel-backend.vercel.app/api/:path*', 
      },
    ];
  },

  // === YAHAN FIX KIYA GAYA HAI ===
  // Doosra section: Images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        port: '',
        pathname: '/**',
      },
      // Hamein Cloudinary ko yahan add karna hai
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // === FIX ENDS HERE ===
};

module.exports = nextConfig;