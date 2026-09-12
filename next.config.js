const path = require('path');

function getOptionalFlagsDefinitionsAlias() {
  try {
    require.resolve('@vercel/flags-definitions');
    return null;
  } catch {
    return path.join(__dirname, 'lib/vercelFlagsDefinitionsStub.mjs');
  }
}

const flagsDefinitionsAlias = getOptionalFlagsDefinitionsAlias();
const turbopackFlagsDefinitionsAlias = flagsDefinitionsAlias
  ? './lib/vercelFlagsDefinitionsStub.mjs'
  : null;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['server', '*.local.tjg.gg', '192.168.1.226'],
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    inlineCss: false,
    // Work around negative dev profiling timestamps (Next.js issue #86060)
    // by keeping React debug info in the RSC stream instead of the WebSocket.
    reactDebugChannel: false,
  },
  images: {
    qualities: [75, 90],
    remotePatterns: [
      { protocol: 'https', hostname: '*.wordpress.com' },
      { protocol: 'https', hostname: '*.wp.com' },
      { protocol: 'https', hostname: '*.gravatar.com' },
      { protocol: 'https', hostname: 'joshskinnertjg.wordpress.com' },
      { protocol: 'https', hostname: 'static.gumroad.com' },
      { protocol: 'https', hostname: 'public-files.gumroad.com' },
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      { protocol: 'https', hostname: 'sammyguru.com' },
      { protocol: 'https', hostname: 'www.sammobile.com' },
      { protocol: 'https', hostname: 'm-cdn.phonearena.com' },
      { protocol: 'https', hostname: 'www.androidheadlines.com' },
      { protocol: 'https', hostname: 'pbs.twimg.com', pathname: '/media/**' },
    ],
  },
  redirects: async () => [
    {
      source: '/work',
      destination: '/#design-work',
      permanent: true,
    },
    {
      source: '/work/oneui-design-kit',
      destination: '/blog/oneui-design-kit',
      permanent: true,
    },
    {
      source: '/twidget/privacy-policy',
      destination: '/blog/twidget-privacy-policy',
      permanent: true,
    },
  ],
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'Content-Security-Policy-Report-Only', value: "default-src 'self'; script-src 'self' https://va.vercel-scripts.com https://vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self'; connect-src 'self' https:; media-src 'self' https:; frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://open.spotify.com https://embed.figma.com https://www.figma.com https://docs.google.com https://www.google.com https://forms.office.com https://sketchfab.com; object-src 'none'; base-uri 'self'; frame-ancestors 'self'" },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
      ],
    },
  ],
  ...(turbopackFlagsDefinitionsAlias
    ? {
        turbopack: {
          resolveAlias: {
            '@vercel/flags-definitions': turbopackFlagsDefinitionsAlias,
          },
        },
      }
    : {}),
  webpack(config) {
    if (flagsDefinitionsAlias) {
      config.resolve.alias['@vercel/flags-definitions'] = flagsDefinitionsAlias;
    }
    return config;
  },
};

module.exports = nextConfig;
