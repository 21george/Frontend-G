/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === "development";

const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: (
        process.env.ALLOWED_ORIGINS ||
        "localhost:3000,localhost:3001,localhost:3002,localhost:3003"
      )
        .split(",")
        .map((s) => s.trim()),
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // engine.io-client (used by socket.io-client) references Node built-ins that
      // don't exist in the browser bundle — tell webpack to ignore them.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        dns: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "coaching-media.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "pub-*.r2.dev",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
      },
    ],
  },
  async headers() {
    const headers = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      { key: "X-DNS-Prefetch-Control", value: "on" },
    ];

    if (!isDev) {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    // Dev-friendly CSP: eval is required for Next.js Fast Refresh/HMR.
    // connect-src must include localhost API and websocket origins.
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8000/v1";
    const apiOrigin = (() => {
      try { return new URL(apiUrl).origin; } catch { return ""; }
    })();

    const connectSrc = [
      "'self'",
      apiOrigin,
      "https://api.openai.com",
      "https://api.open-meteo.com",
      "https://nominatim.openstreetmap.org",
      "ws:",
      "wss:",
    ].filter(Boolean);

    const csp = isDev
      ? [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https: http: blob:",
          "font-src 'self'",
          `connect-src ${connectSrc.join(" ")}`,
          "frame-src https://js.stripe.com https://hooks.stripe.com",
          "media-src 'self' https: http: blob:",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join("; ")
      : [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' https://js.stripe.com",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https: blob:",
          "font-src 'self'",
          `connect-src ${connectSrc.join(" ")}`,
          "frame-src https://js.stripe.com https://hooks.stripe.com",
          "media-src 'self' https: blob:",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join("; ");

    headers.push({ key: "Content-Security-Policy", value: csp });

    return [{ source: "/(.*)", headers }];
  },
};
module.exports = nextConfig;
