/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/supabase/:path*',
        destination: 'https://wpjixgfnynrboptwpotd.supabase.co/:path*',
      },
    ]
  },
}

module.exports = nextConfig
