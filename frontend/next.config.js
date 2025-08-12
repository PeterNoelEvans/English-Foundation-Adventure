/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['lms-pne.uk'],
  async rewrites() {
    // Use environment variable to determine the API destination
    const apiDestination = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000/api/:path*'
      : 'http://localhost:3000/api/:path*';
    const uploadsDestination = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000/uploads/:path*'
      : 'http://localhost:3000/uploads/:path*';
    
    return [
      {
        source: '/api/:path*',
        destination: apiDestination,
      },
      {
        source: '/uploads/:path*',
        destination: uploadsDestination,
      }
    ];
  },
};

module.exports = nextConfig;

