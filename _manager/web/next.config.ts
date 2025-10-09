import type { NextConfig } from "next";
import path from 'path';
import dotenv from 'dotenv';

// Load root .env file
dotenv.config({ path: path.join(__dirname, '../..', '.env') });

const nextConfig: NextConfig = {
  webpack: (config, { dev }) => {
    if (dev) {
      // Force polling and ignore everything outside project
      config.watchOptions = {
        poll: 3000,
        aggregateTimeout: 600,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
          path.join(__dirname, '../../**'),  // Ignore parent directories
          '!./**'  // But watch current directory
        ]
      };

      // Disable snapshots completely
      config.snapshot = {
        managedPaths: [],
        immutablePaths: [],
        buildDependencies: {
          hash: false,
          timestamp: false
        },
        module: {
          hash: false,
          timestamp: false
        },
        resolve: {
          hash: false,
          timestamp: false
        },
        resolveBuildDependencies: {
          hash: false,
          timestamp: false
        }
      };
    }

    return config;
  },

  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
