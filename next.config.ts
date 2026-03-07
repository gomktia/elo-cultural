import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // @ts-ignore
  turbopack: {
    root: '.',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vlibras.gov.br",
              "style-src 'self' 'unsafe-inline' https://unpkg.com https://fonts.googleapis.com https://vlibras.gov.br",
              "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co https://*.tile.openstreetmap.org https://cdnjs.cloudflare.com https://vlibras.gov.br",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co https://api.openai.com https://*.sentry.io https://*.ingest.sentry.io https://*.tile.openstreetmap.org https://vlibras.gov.br",
              "worker-src 'self' blob:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
};

export default withSentryConfig(nextConfig, {
  // Suppress source map upload warnings when SENTRY_AUTH_TOKEN is not set
  silent: true,

  // Upload source maps for better stack traces
  widenClientFileUpload: true,

  // Disable Sentry telemetry
  telemetry: false,

  // Hide source maps from users
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
