import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Static export: `next build` writes a fully static site to out/ for S3 + CloudFront.
  output: 'export',
  // No image optimizer exists on S3, and pixel art must not be resampled anyway.
  images: { unoptimized: true },
  // S3 website hosting serves /path/ as /path/index.html, so emit directories.
  trailingSlash: true,
}

export default nextConfig
