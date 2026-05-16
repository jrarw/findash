import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: false,
  },
  async redirects() {
    return [
      {
        source: '/dashboard/metas',
        destination: '/dashboard/planejamento?tab=metas',
        permanent: false,
      },
      {
        source: '/dashboard/orcamento',
        destination: '/dashboard/planejamento?tab=orcamento',
        permanent: false,
      },
      {
        source: '/dashboard/categorias',
        destination: '/dashboard/planejamento?tab=categorias',
        permanent: false,
      },
    ]
  },
};

export default nextConfig;
