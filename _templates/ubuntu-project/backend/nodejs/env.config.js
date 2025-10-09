/**
 * Environment Configuration
 * Loads environment variables from root .env file
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  // Database - MySQL
  mysql: {
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB_NAME,
  },

  // Database - PostgreSQL
  postgres: {
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB_NAME,
  },

  // Server
  server: {
    port: parseInt(process.env.BE_NODEJS_PORT || '3001'),
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // GraphQL
  graphql: {
    port: parseInt(process.env.API_GRAPHQL_PORT || '4000'),
    introspection: process.env.GRAPHQL_INTROSPECTION === 'true',
    playground: process.env.GRAPHQL_PLAYGROUND === 'true',
  },

  // REST API
  rest: {
    port: parseInt(process.env.API_REST_PORT || '5000'),
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
};
