# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Docker-based platform management system for creating and managing multiple isolated Ubuntu development platforms on a Synology NAS. Each platform can host multiple projects with automated port allocation, infrastructure services, and standardized tooling.

**Key Concept**: Root path is `/var/services/homes/jungsam/dockers` (configurable via `.env` as `DOCKER_ROOT_PATH`)

## Repository Structure

```
dockers/
├── _manager/              # Platform & project management suite (unified workspace)
│   ├── api/              # Express.js REST API (TypeScript)
│   ├── web/              # Next.js 15.5.4 + React 19 frontend
│   ├── scripts/          # Automation scripts (port-allocator.js, etc.)
│   ├── data/             # JSON data storage (platforms, projects, repositories, etc.)
│   └── package.json      # Root workspace configuration
├── _templates/           # Templates for code generation
│   ├── docker/           # Docker infrastructure templates
│   │   ├── docker-ubuntu/      # Platform template
│   │   └── ubuntu-project/     # Project template (deprecated location)
│   ├── env/              # Environment file templates
│   ├── doc/              # Documentation templates
│   └── ui/               # UI component templates
├── platforms/            # Created platforms (each is a git repo)
│   └── ubuntu-ilmac/     # Example platform
├── networks/             # Shared network services
│   ├── nginx/            # Reverse proxy configuration
│   └── certbot/          # SSL certificate management
├── databases/            # Database services
├── cu.sh                 # Create Ubuntu platform script
├── remove-platform.sh    # Remove platform (remote/local/all)
├── remove-project.sh     # Remove project (remote/local/all)
├── restart-domains.sh    # Restart nginx domains
└── .env                  # Root configuration
```

## Common Commands

### Manager (Unified Workspace)

The `_manager` directory uses npm workspaces to manage API, web, and scripts together.

```bash
# Development - Both API and Web
cd /var/services/homes/jungsam/dockers/_manager
npm run dev              # Runs both API and web in parallel

# Development - Individual services
npm run dev:api          # API only (port from .env:MANAGER_API_PORT, default 20101)
npm run dev:web          # Web only (port from .env:MANAGER_WEB_PORT, default 20100)

# Production
npm run build            # Build both API and web
npm run start            # Start both in production mode
npm run start:api        # Start API only
npm run start:web        # Start Web only

# Testing & Linting
npm test                 # Run API tests (Jest)
npm run lint             # Lint both API and web
```

**Important**: The web dev server uses polling for file watching in Docker:
- `WATCHPACK_POLLING=true CHOKIDAR_USEPOLLING=true` are set in web/package.json

**Access URLs** (configured in `.env`):
- API Documentation: http://1.231.118.217:20101/doc/ (Swagger)
- Web Interface: http://1.231.118.217:20100

### Platform Management

```bash
# Create new platform (automatically assigns platform SN and base port)
cd /var/services/homes/jungsam/dockers
./cu.sh -n <platform-name> -u <github-user> -d "Platform description"

# Example:
./cu.sh -n ubuntu-dev -u myuser -d "Development platform for team projects"

# Remove platform
./remove-platform.sh -n <platform-name> -r [remote|local|all]
# -r remote: delete GitHub repo only
# -r local: delete local directory only
# -r all: delete both (default)
```

### Project Management

```bash
# Create new project within a platform
cd /var/services/homes/jungsam/dockers/platforms/<platform-name>/projects
./cp.sh -p <platform-name> -n <project-name> -u <github-user> -d "Project description"

# Example:
cd /var/services/homes/jungsam/dockers/platforms/ubuntu-ilmac/projects
./cp.sh -p ubuntu-ilmac -n my-web-app -u myuser -d "Customer web application"

# Remove project
cd /var/services/homes/jungsam/dockers
./remove-project.sh -n <project-name> -r [remote|local|all]
```

### Network & Domain Management

```bash
# Restart nginx domains (reload SSL certificates and configurations)
cd /var/services/homes/jungsam/dockers
./restart-domains.sh
```

## Port Allocation System

**Critical**: Ports are automatically managed via `_manager/scripts/port-allocator.js`. Never manually assign ports.

### Port Structure
- **Total Range**: 21001-21283 (configured in `.env`)
- **Platform Allocation**: 200 ports per platform (max 45 platforms)
- **Project Allocation**: 20 ports per project (max 10 projects per platform)
- **Manager Ports**: API=20101, Web=20100 (configured in `.env`)

### Port Offset per Project (20 ports)
**Production (offsets 0-9)**:
- 0: SSH
- 1: Backend (Node.js)
- 2: Backend (Python)
- 3: API (GraphQL)
- 4: API (REST)
- 5: API (Reserved)
- 6: Frontend (Next.js)
- 7: Frontend (SvelteKit)
- 8: Frontend (Reserved)
- 9: System (Reserved)

**Development (offsets 10-19)**: Same as production +10

### Port Allocator Usage

```bash
# Get platform port allocation
node _manager/scripts/port-allocator.js platform <platform-sn>

# Get project port allocation
node _manager/scripts/port-allocator.js project <platform-sn> <project-sn>

# Get next available platform SN
node _manager/scripts/port-allocator.js next-platform _manager/data/platforms.json

# Get next available project SN for a platform
node _manager/scripts/port-allocator.js next-project _manager/data/projects.json <platform-id>

# Generate .env content for project
node _manager/scripts/port-allocator.js generate-env <platform-sn> <project-sn> <platform-name> <project-name>

# Validate port allocation
node _manager/scripts/port-allocator.js validate <platform-sn> <project-sn> <offset>
```

### Port Calculation Formula
```
Platform Base Port = BASE_PLATFORM_PORT + (PLATFORM_SN × 200)
Project Base Port = Platform Base Port + (PROJECT_SN × 20)
Service Port = Project Base Port + Offset
```

**Configuration** (from `.env`):
- `BASE_PLATFORM_PORT=21000`
- `PORTS_PER_PLATFORM=200`
- `PORTS_PER_PROJECT=20`

**Example**: Platform 1, Project 2, Node.js Backend Dev
- Platform Base: 21000 + (1 × 200) = 21200
- Project Base: 21200 + (2 × 20) = 21240
- Node.js Dev Port: 21240 + 11 = 21251

## Architecture

### Platform Creation Flow (`cu.sh`)
1. Loads `DOCKER_ROOT_PATH` from `.env`
2. Calls `_manager/scripts/port-allocator.js` to get next platform SN (or reuse existing SN)
3. Calculates base port using formula: `BASE_PLATFORM_PORT + (SN × 200)`
4. Generates secure passwords/secrets (MySQL, PostgreSQL, JWT) using `openssl rand -hex`
5. Copies template from `_templates/docker/docker-ubuntu` to `platforms/<platform-name>`
6. Substitutes variables in template files: `${PLATFORM_NAME}`, `${PLATFORM_SN}`, `${BASE_PLATFORM_PORT}`, etc.
7. Initializes git repository via `xgit` command (GitHub)
8. Updates `_manager/data/platforms.json` with platform metadata
9. Updates `_manager/data/repositories.json` via `_manager/scripts/update-repositories.js`

### Project Creation Flow (`cp.sh`)
1. Located in `platforms/<platform-name>/projects/cp.sh`
2. Reads platform SN from `_manager/data/platforms.json`
3. Gets next project SN via `_manager/scripts/port-allocator.js`
4. Calculates all 20 project ports (production + development)
5. Creates project from `_templates/docker/ubuntu-project`
6. Substitutes project-specific variables (ports, names, etc.)
7. Generates environment files with port configurations
8. Updates `_manager/data/projects.json` via `_manager/scripts/update-projects.js`
9. Initializes git repository and updates `_manager/data/repositories.json`

### Manager API Architecture

**Tech Stack**: Express.js + TypeScript + tsx (dev server) + Jest (testing)

**Structure**:
- `api/src/index.ts` - Application entry point with Express setup
- `api/src/routes/` - API route handlers
  - `databases.ts` - Database management endpoints
  - `platforms.ts` - Platform CRUD operations
  - `projects.ts` - Project CRUD operations
  - `servers.ts` - Server infrastructure endpoints
  - `gitusers.ts` - Git user management
  - `scripts.ts` - Automation script endpoints
- `api/src/services/` - Business logic layer
  - `platformService.ts` - Platform operations
  - `projectService.ts` - Project operations
  - `portService.ts` - Port allocation wrapper (calls `scripts/port-allocator.js`)
- `api/src/types/` - TypeScript type definitions
- `api/src/utils/` - Helper utilities
- `api/src/swagger/` - Swagger/OpenAPI documentation

**Key Integration**: The API wraps shell scripts via `child_process.execSync`:
- Calls `_manager/scripts/port-allocator.js` for port calculations
- Reads/writes JSON files in `_manager/data/`

**Data Storage**: JSON files in `_manager/data/`
- `platforms.json` - Platform metadata (id, sn, basePort, githubUser, createdAt, etc.)
- `projects.json` - Project metadata (id, sn, platformId, ports, etc.)
- `repositories.json` - Git repository information (GitHub and local repos)
- `servers.json` - Server configurations
- `databases.json` - Database configurations
- `gitusers.json` - Git user information
- `networks.json` - Network configurations
- `schema.json` - JSON schema definitions

### Manager Web Architecture

**Tech Stack**: Next.js 15.5.4 (App Router) + React 19 + TypeScript + Tailwind CSS 4

**Structure**:
- `web/src/app/` - Next.js App Router pages
  - `platforms/[id]/` - Platform detail and project management
  - `servers/` - Server infrastructure pages (database, n8n, obsidian, wordpress)
  - `repositories/` - Repository management (github, local)
  - `networks/` - Network services (nginx, certbot)

**Key Features**:
- Uses polling for file watching in Docker environment
- Server-side rendering with React Server Components
- API integration via fetch to Manager API

## Important Variable Substitution

When working with templates, these variables are automatically substituted:

**Platform Variables**:
- `${PLATFORM_NAME}` - Platform identifier (e.g., "ubuntu-ilmac")
- `${PLATFORM_NAME_UPPER}` - Uppercase version (e.g., "UBUNTU_ILMAC")
- `${PLATFORM_NAME_LOWER}` - Lowercase version (e.g., "ubuntu_ilmac")
- `${PLATFORM_SN}` - Platform serial number (0, 1, 2, ...)
- `${BASE_PLATFORM_PORT}` - Platform base port (11000, 11200, ...)
- `${GITHUB_USER}` - GitHub username
- `${PLATFORM_DESCRIPTION}` - Platform description
- `${MYSQL_ROOT_PASSWORD}` - Auto-generated MySQL password
- `${POSTGRES_PASSWORD}` - Auto-generated PostgreSQL password
- `${JWT_SECRET_SALT}` - Auto-generated JWT secret
- `${ENCRYPTION_KEY}` - Auto-generated encryption key

**Project Variables**:
- `${PROJECT_NAME}` - Project identifier
- `${PROJECT_SN}` - Project serial number within platform
- `${BASE_PROJECT_PORT}` - Project base port
- All service-specific ports (SSH_PORT_PROD, BE_NODEJS_PORT_DEV, etc.)

## Key Files Modified During Setup

**Platform Creation** (`cu.sh`):
- `platforms/<name>/README.md` - Substituted with platform info
- `platforms/<name>/package.json` - Platform name and description
- `platforms/<name>/scripts/dev-start.sh` - Development scripts
- `platforms/<name>/environments/{development,staging,production}/.env` - Environment configs with SN and ports
- `platforms/<name>/docker-compose.yml` - Platform name only (ports use .env references)
- `_manager/data/platforms.json` - Platform metadata added/updated
- `_manager/data/repositories.json` - GitHub repo registered

**Project Creation** (`cp.sh`):
- `platforms/<platform>/projects/<name>/` - Entire project structure from template
- `.env` files with all 20 port configurations (production + development)
- `_manager/data/projects.json` - Project metadata added
- `_manager/data/repositories.json` - Project repo registered

## Security Notes

- Passwords and secrets are auto-generated using `openssl rand -hex 16` (passwords) and `openssl rand -hex 32` (JWT secrets)
- Never commit `.env` files with real credentials
- JSON data files in `_manager/data/` are version controlled but contain only metadata (no passwords)
- Each platform/project generates its own secure credentials during creation

## Best Practices

1. **Always use automation scripts**: Use `cu.sh` and `cp.sh` instead of manual copying
2. **Never manually assign ports**: Use port-allocator.js for all port assignments
3. **Check next available SN**: Before creating platforms/projects, verify available SNs
4. **Use environment variables**: Reference ports via env vars in docker-compose files, not hardcoded values
5. **Root path flexibility**: Code should use `DOCKER_ROOT_PATH` from `.env`, not hardcoded `/var/services/homes/jungsam/dockers`
6. **Template updates**: When modifying templates, ensure variable substitution patterns remain intact

## Data Management

All platform/project metadata is stored in JSON files under `_manager/data/`:
- These files are version controlled
- Manager API reads/writes to these files directly (no database)
- Used by port allocator to track SN assignments
- Format includes metadata section with version and lastUpdated timestamp
- **Important**: JSON files serve as the single source of truth for the system

### Data File Schema

Each JSON file follows this pattern:
```json
{
  "metadata": {
    "version": "1.0.0",
    "lastUpdated": "2024-10-18T00:00:00Z",
    "total<Entity>s": 5
  },
  "<entities>": {
    "<entity-id>": { /* entity data */ }
  }
}
```

## Development Workflow

1. Start manager services: `cd _manager && npm run dev`
2. Create platforms using `cu.sh` (auto-assigns ports and SN)
3. Create projects within platforms using `cp.sh`
4. Each project gets isolated environment with dedicated port ranges
5. Use manager web UI to view/manage all platforms and projects
6. Port conflicts are prevented by automated allocation system
7. Use removal scripts when cleaning up platforms/projects

## Testing

Manager API uses Jest for testing:
```bash
cd /var/services/homes/jungsam/dockers/_manager
npm test
```

## Automation Scripts Reference

Key scripts in `_manager/scripts/`:
- `port-allocator.js` - Port calculation and allocation (used by cu.sh, cp.sh, API)
- `update-repositories.js` - Update repositories.json (add-github, remove)
- `update-projects.js` - Update projects.json
- `create-project-db.js` - Project database initialization

These scripts are called by shell scripts (cu.sh, cp.sh, remove-*.sh) and by the API.

## Working with Templates

Templates are located in `_templates/` and use variable substitution patterns:

### Template Types
- `_templates/docker/docker-ubuntu/` - Full platform template
- `_templates/docker/ubuntu-project/` - Project template (deprecated location)
- `_templates/env/` - Environment file templates (env.docker, env.platform, env.project)
- `_templates/doc/` - Documentation templates
- `_templates/ui/` - UI component templates (shadcn, etc.)

### Variable Substitution Rules
- Shell scripts use `sed` to replace `${VARIABLE}` patterns
- Substitution happens during `cu.sh` and `cp.sh` execution
- docker-compose.yml uses env vars at runtime (not substituted during creation)
- All variables must be exported in the shell script before substitution

## xgit Integration

The system uses a custom `xgit` command for GitHub repository management:
- `xgit -e make -n <name> -u <user> -d "<description>"` - Create repo
- `xgit -e del -n <name> -u <user>` - Delete remote repo only
- `xgit -e remove -n <name> -u <user>` - Delete both remote and local

**Important**:
- cu.sh and cp.sh call xgit automatically
- remove-platform.sh and remove-project.sh also use xgit
- xgit must be available in PATH

## Environment Configuration

The root `.env` file controls critical system settings:

**Key Variables**:
- `DOCKER_ROOT_PATH` - Root path for all dockers (default: /var/services/homes/jungsam/dockers)
- `BASE_PLATFORM_PORT` - Starting port for platform allocation (21000)
- `PORTS_PER_PLATFORM` - Ports allocated per platform (200)
- `PORTS_PER_PROJECT` - Ports allocated per project (20)
- `MANAGER_API_PORT` - Manager API port (20101)
- `MANAGER_WEB_PORT` - Manager web UI port (20100)

**Network Services**:
- `NGINX_ROOT_PATH` - Nginx configuration path
- `CERTBOT_ROOT_PATH` - Certbot SSL certificates path
- `SSL_SETTINGS_PATH` - SSL site settings

**Databases**:
- `MYSQL_PORT=20201`, `POSTGRES_PORT=20203`
- Shared database services for all platforms

## Common Pitfalls

1. **Port Conflicts**: Always use port-allocator.js, never hardcode ports
2. **Path References**: Use `DOCKER_ROOT_PATH` from .env, not absolute paths in code
3. **JSON Data Sync**: Scripts and API both modify JSON files - ensure no race conditions
4. **Variable Substitution**: docker-compose.yml should reference .env vars, not get substituted
5. **Platform SN Reuse**: Existing platforms keep their SN even if recreated
6. **npm Workspace**: Run npm commands from `_manager/` root, not api/ or web/ directly (unless using workspace-specific commands)
