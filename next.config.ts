import type { NextConfig } from "next";

// Allow next/image to optimise images served from our Supabase Storage bucket.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "jhazmjakhelytdluoqvg.supabase.co";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    return [
      // The Vahan Puja pooja was renamed from its mislabeled slug.
      {
        source: "/poojas/satyanarayan-vrat",
        destination: "/poojas/vahan-puja",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
