export const resolvers = {
  Query: {
    hello: () => 'Hello from {{PROJECT_NAME}} GraphQL server!',
    version: () => '1.0.0',
  },
  Mutation: {
    ping: () => 'pong',
  },
};