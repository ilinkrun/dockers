import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { typeDefs } from './schema/index.js';
import { resolvers } from './resolvers/index.js';

// Load environment variables
dotenv.config();

const PORT = process.env.GRAPHQL_PORT || 4001;

async function startApolloServer() {
  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    introspection: process.env.GRAPHQL_INTROSPECTION === 'true',
  });

  await server.start();

  app.use(helmet());

  app.use(
    '/graphql',
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
    }),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({ token: req.headers.authorization }),
    }),
  );

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: '{{PROJECT_NAME}}-graphql',
      timestamp: new Date().toISOString()
    });
  });

  await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));

  console.log(`🚀 {{PROJECT_NAME}} GraphQL server ready at http://localhost:${PORT}/graphql`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
}