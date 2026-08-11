import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/school/weekly", destination: "/", permanent: true },
      {
        source: "/school/assessments",
        destination: "/school/calendar",
        permanent: true,
      },
      {
        source: "/school/roadmap",
        destination: "/school/calendar",
        permanent: true,
      },
      {
        source: "/school/tools",
        destination: "/career/2028",
        permanent: true,
      },
      {
        source: "/admin/class-items/new",
        destination: "/admin",
        permanent: true,
      },
      {
        source: "/admin/roadmap-items/new",
        destination: "/admin",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
