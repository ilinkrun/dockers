/**
 * Environment Configuration for SvelteKit
 *
 * Usage:
 * - Server-side: import from '$env/dynamic/private'
 * - Client-side: import from '$env/dynamic/public' (PUBLIC_* variables only)
 */

import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

export const env = {
  // Server-side only (not exposed to browser)
  server: {
    mysql: {
      host: privateEnv.MYSQL_HOST || 'localhost',
      port: parseInt(privateEnv.MYSQL_PORT || '3306'),
      user: privateEnv.MYSQL_USER || 'root',
      password: privateEnv.MYSQL_PASSWORD || '',
      database: privateEnv.MYSQL_DB_NAME || '',
    },
    postgres: {
      host: privateEnv.POSTGRES_HOST || 'localhost',
      port: parseInt(privateEnv.POSTGRES_PORT || '5432'),
      user: privateEnv.POSTGRES_USER || 'postgres',
      password: privateEnv.POSTGRES_PASSWORD || '',
      database: privateEnv.POSTGRES_DB_NAME || '',
    },
  },

  // Client-side (exposed to browser via PUBLIC_ prefix)
  client: {
    backendUrl: publicEnv.PUBLIC_BACKEND_URL || 'http://localhost:3001',
    graphqlUrl: publicEnv.PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql',
    restApiUrl: publicEnv.PUBLIC_REST_API_URL || 'http://localhost:5000',
  },

  // Available on both server and client
  nodeEnv: privateEnv.NODE_ENV || 'development',
  isDevelopment: privateEnv.NODE_ENV !== 'production',
  isProduction: privateEnv.NODE_ENV === 'production',
} as const;

export default env;
