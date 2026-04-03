/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed API rewrites since we're now using direct API calls to the backend
  async rewrites() {
    return [
      // API rewrites have been removed as we're now calling the backend directly
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