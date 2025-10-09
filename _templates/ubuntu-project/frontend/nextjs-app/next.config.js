const path = require('path');

// Load environment variables from parent directory
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Server-side env vars
    BE_NODEJS_PORT: process.env.BE_NODEJS_PORT,
    API_GRAPHQL_PORT: process.env.API_GRAPHQL_PORT,
    API_REST_PORT: process.env.API_REST_PORT,

    // Make them available on client-side by re-exporting with NEXT_PUBLIC_ prefix
    NEXT_PUBLIC_BE_NODEJS_PORT: process.env.BE_NODEJS_PORT,
    NEXT_PUBLIC_API_GRAPHQL_PORT: process.env.API_GRAPHQL_PORT,
    NEXT_PUBLIC_API_REST_PORT: process.env.API_REST_PORT,
  },
};

module.exports = nextConfig;
