import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // 明确指定 frontend 目录为工作区根目录
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
