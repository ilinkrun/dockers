# Environment Variables Setup Guide

This project uses a single root `.env` file that is shared across all subprojects.

## File Structure

```
{projectName}/
├── .env                          # ✅ Single source of truth
├── .env.dev                      # Development overrides
├── .env.prod                     # Production overrides
├── backend/
│   ├── nodejs/
│   │   └── env.config.js        # Config loader
│   └── python/
│       └── env_config.py        # Config loader
└── frontend/
    ├── nextjs-app/
    │   └── env.config.ts        # Config loader
    └── sveltekit-app/
        └── src/lib/env.config.ts # Config loader
```

## Usage Examples

### Backend - Node.js

```javascript
// Load config
const config = require('./env.config');

// Use MySQL
const mysql = require('mysql2/promise');
const connection = await mysql.createConnection(config.mysql);

// Use server port
const app = express();
app.listen(config.server.port, () => {
  console.log(`Server running on port ${config.server.port}`);
});
```

### Backend - Python

```python
# Load config
from env_config import config

# Use MySQL
import mysql.connector
connection = mysql.connector.connect(
    host=config.MYSQL_HOST,
    port=config.MYSQL_PORT,
    user=config.MYSQL_USER,
    password=config.MYSQL_PASSWORD,
    database=config.MYSQL_DB_NAME
)

# Or use the URL
from sqlalchemy import create_engine
engine = create_engine(config.mysql_url)

# Use server port
import uvicorn
uvicorn.run(app, host="0.0.0.0", port=config.BE_PYTHON_PORT)
```

### Frontend - Next.js

#### Server-side (API Routes, getServerSideProps, etc.)

```typescript
import { env } from './env.config';

// In API route
export default async function handler(req, res) {
  // Access database directly (server-side only)
  const mysql = require('mysql2/promise');
  const connection = await mysql.createConnection(env.server.mysql);
  // ...
}
```

#### Client-side (Components, hooks, etc.)

```typescript
import { env } from './env.config';

export default function MyComponent() {
  useEffect(() => {
    // Call backend API (client-side safe)
    fetch(`${env.client.graphqlUrl}`, {
      method: 'POST',
      body: JSON.stringify({ query: '...' })
    });
  }, []);
}
```

#### Add to .env for client-side access

```bash
# Client-side variables need NEXT_PUBLIC_ prefix
NEXT_PUBLIC_BACKEND_URL=http://localhost:11201
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:11203/graphql
NEXT_PUBLIC_REST_API_URL=http://localhost:11204
```

### Frontend - SvelteKit

#### Server-side (+page.server.ts, hooks.server.ts, etc.)

```typescript
import { env } from '$lib/env.config';

// In server load function
export const load = async () => {
  // Access database directly (server-side only)
  const mysql = require('mysql2/promise');
  const connection = await mysql.createConnection(env.server.mysql);
  // ...
};
```

#### Client-side (+page.svelte, components, etc.)

```typescript
<script>
import { env } from '$lib/env.config';

async function fetchData() {
  // Call backend API (client-side safe)
  const response = await fetch(`${env.client.graphqlUrl}`, {
    method: 'POST',
    body: JSON.stringify({ query: '...' })
  });
}
</script>
```

#### Add to .env for client-side access

```bash
# Client-side variables need PUBLIC_ prefix
PUBLIC_BACKEND_URL=http://localhost:11201
PUBLIC_GRAPHQL_URL=http://localhost:11203/graphql
PUBLIC_REST_API_URL=http://localhost:11204
```

## Important Notes

### Security

1. **Never expose sensitive data to client-side**:
   - ❌ Database credentials
   - ❌ API secrets
   - ❌ Private keys

2. **Client-side variables MUST have prefix**:
   - Next.js: `NEXT_PUBLIC_*`
   - SvelteKit: `PUBLIC_*`

3. **Backend URLs are safe to expose** (they're just URLs, not credentials)

## Best Practices

1. **Use the config modules** instead of direct `process.env` access
2. **Keep `.env` in version control** (without sensitive data)
3. **Use `.env.local` for local overrides** (gitignored)
4. **Document all environment variables**
5. **Validate required variables** on app startup
