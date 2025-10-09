import gql from 'graphql-tag';

export const typeDefs = gql`
  type Query {
    hello: String
    version: String
  }

  type Mutation {
    ping: String
  }
`;