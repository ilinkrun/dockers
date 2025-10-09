# {{PROJECT_NAME}} Backend

{{PROJECT_DESCRIPTION}} backend service built with Node.js, TypeScript, Express, and GraphQL.

## 🏗️ Architecture

```
backend/
├── src/
│   ├── database/          # Database connection and utilities
│   ├── execs/            # Executable scripts
│   ├── graphql/          # GraphQL server and schema
│   │   ├── resolvers/    # GraphQL resolvers
│   │   └── schema/       # GraphQL schema definitions
│   ├── tests/            # Test files
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   └── index.ts          # Main application entry point
├── dist/                 # Compiled JavaScript output
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── .swcrc               # SWC compiler configuration
└── .env.example         # Environment variables template
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MySQL 8.0+

### Installation

1. Install dependencies:
```bash
npm install
```

2. Setup environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start development server:
```bash
npm run dev
```

## 📋 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run graphql:dev` - Start GraphQL server in development
- `npm run test` - Run tests
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🛠️ Technology Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Web Framework**: Express.js
- **GraphQL**: Apollo Server
- **Database**: MySQL with mysql2
- **Build Tool**: SWC
- **Testing**: Vitest
- **Code Quality**: ESLint + Prettier

## 📖 API Documentation

### REST Endpoints

- `GET /health` - Health check
- `GET /api` - API information

### GraphQL Endpoint

- `POST /graphql` - GraphQL endpoint
- Visit `/graphql` in browser for GraphQL Playground (development only)

## 🔧 Environment Variables

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER={{PROJECT_NAME}}_user
DB_PASSWORD={{PROJECT_NAME}}_password
DB_NAME={{PROJECT_NAME}}_db

# Server Configuration
PORT=4000
NODE_ENV=development

# GraphQL Configuration
GRAPHQL_INTROSPECTION=true
GRAPHQL_PLAYGROUND=true

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```