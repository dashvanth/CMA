import type {NextConfig} from 'next';
import CopyPlugin from 'copy-webpack-plugin';
import path from 'path';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // pdfjs-dist
    const pdfjsDistPath = path.dirname(require.resolve('pdfjs-dist/package.json'));
    const pdfWorkerPath = path.join(pdfjsDistPath, 'build', 'pdf.worker.min.mjs');
    const pdfcmapsPath = path.join(pdfjsDistPath, 'cmaps');

    config.plugins.push(
      new CopyPlugin({
        patterns: [
          {
            from: pdfWorkerPath,
            to: path.join(config.output.path!, 'static', 'chunks'),
          },
          {
            from: pdfcmapsPath,
            to: path.join(config.output.path!, 'static', 'cmaps'),
          },
        ],
      }),
    );
    
    return config;
  },
};

export default nextConfig;
