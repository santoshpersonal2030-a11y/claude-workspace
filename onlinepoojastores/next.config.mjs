import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // This app lives in a subfolder of a larger repo; pin the tracing root here
  // so Next doesn't get confused by the parent project's lockfile.
  outputFileTracingRoot: __dirname,
  // Don't block production builds on lint (keeps Vercel deploys green).
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
