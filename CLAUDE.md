# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Docker-based platform management system for creating and managing multiple isolated Ubuntu development platforms on a Synology NAS. Each platform can host multiple projects with automated port allocation, infrastructure services, and standardized tooling.

**Key Concept**: Root path is `/var/services/homes/jungsam/dockers` (configurable via `.env` as `DOCKER_ROOT_PATH`)

## Repository Structure

```
docker-platforms/
├── _manager/              # Platform & project management web app
│   ├── api/              # Express.js REST API (port 10101)
│   └── web/              # Next.js frontend (port 10100)
├── _scripts/             # Automation scripts
│   └── port-allocator.js # Port allocation utility
├── _templates/docker/           # Platform and project templates
│   ├── docker-ubuntu/    # Ubuntu platform template
│   └── ubuntu-project/   # Project template
├── _settings/            # Generated settings (gitignored)
│   ├── dockers/          # Platform .env files
│   └── projects/         # Project settings
├── platforms/            # Created platforms live here
│   └── ubuntu-ilmac/     # Example platform
├── cu.sh                 # Create Ubuntu platform script
└── .env                  # Root configuration
```

## Common Commands

### Platform Management

```bash
# Create new platform (automatically assigns platform SN and base port)
cd /var/services/homes/jungsam/dockers
./cu.sh -n <platform-name> -u <github-user> -d "Platform description"

# Example:
./cu.sh -n ubuntu-dev -u myuser -d "Development platform for team projects"
```

### Project Management

```bash
# Create new project within a platform
cd /var/services/homes/jungsam/dockers/platforms/<platform-name>/projects
./cp.sh -n <project-name> -u <github-user> -d "Project description"

# Example:
cd /var/services/homes/jungsam/dockers/platforms/ubuntu-ilmac/projects
./cp.sh -n my-web-app -u myuser -d "Customer web application"
```

### Manager API

```bash
# Development mode (auto-restart)
cd /var/services/homes/jungsam/dockers/_manager/api
npm run dev

# Production mode
cd /var/services/homes/jungsam/dockers/_manager/api
npm run build && npm run start

# Run tests
npm test

# Lint
npm run lint
```

**API Documentation**: http://1.231.118.217:3001/doc/ (Swagger)

### Manager Web

```bash
# Development mode
cd /var/services/homes/jungsam/dockers/_manager/web
npm run dev

# Production mode
cd /var/services/homes/jungsam/dockers/_manager/web
npm run build && npm run start

# Lint
npm run lint
```

**Web Interface**: http://1.231.118.217:3000

## Port Allocation System

**Critical**: Ports are automatically managed via `_scripts/port-allocator.js`. Never manually assign ports.

### Port Structure
- **Total Range**: 11000-19999 (9000 ports)
- **Platform Allocation**: 200 ports per platform (max 45 platforms)
- **Project Allocation**: 20 ports per project (max 10 projects per platform)
- **Manager Ports**: API=10101, Web=10100

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
node _scripts/port-allocator.js platform <platform-sn>

# Get project port allocation
node _scripts/port-allocator.js project <platform-sn> <project-sn>

# Get next available platform SN
node _scripts/port-allocator.js next-platform _manager/data/platforms.json

# Get next available project SN for a platform
node _scripts/port-allocator.js next-project _manager/data/projects.json <platform-id>

# Generate .env content for project
node _scripts/port-allocator.js generate-env <platform-sn> <project-sn> <platform-name> <project-name>

# Validate port allocation
node _scripts/port-allocator.js validate <platform-sn> <project-sn> <offset>
```

### Port Calculation Formula
```
Platform Base Port = 11000 + (PLATFORM_SN × 200)
Project Base Port = Platform Base Port + (PROJECT_SN × 20)
Service Port = Project Base Port + Offset
```

**Example**: Platform 1, Project 2, Node.js Backend Dev
- Platform Base: 11000 + (1 × 200) = 11200
- Project Base: 11200 + (2 × 20) = 11240
- Node.js Dev Port: 11240 + 11 = 11251

## Architecture

### Platform Creation Flow (`cu.sh`)
1. Loads `DOCKER_ROOT_PATH` from `.env`
2. Calls `port-allocator.js` to get next platform SN
3. Calculates base port (11000 + SN × 200)
4. Creates platform settings in `_settings/dockers/.env.<platform-name>`
5. Generates secure passwords/secrets (MySQL, PostgreSQL, JWT)
6. Copies template from `_templates/docker/docker-ubuntu`
7. Substitutes variables: `${PLATFORM_NAME}`, `${PLATFORM_SN}`, `${BASE_PLATFORM_PORT}`, etc.
8. Initializes git repository via `xgit` command
9. Saves metadata to `_manager/data/platforms.json`

### Project Creation Flow (`cp.sh`)
1. Reads platform SN from `platforms.json`
2. Gets next project SN via `port-allocator.js`
3. Calculates all 20 project ports
4. Creates project from `_templates/docker/ubuntu-project`
5. Substitutes project-specific variables
6. Generates environment files with port configurations
7. Saves metadata to `_manager/data/projects.json`

### Manager API Architecture

**Tech Stack**: Express.js + TypeScript

**Structure**:
- `src/index.ts` - Application entry point
- `src/routes/` - API route handlers (databases, platforms, projects, servers, gitusers, scripts)
- `src/services/` - Business logic (platformService, projectService, portService)
- `src/types/` - TypeScript type definitions
- `src/utils/` - Helper utilities
- `src/swagger/` - Swagger/OpenAPI documentation

**Data Storage**: JSON files in `_manager/data/`
- `platforms.json` - Platform metadata
- `projects.json` - Project metadata
- `servers.json` - Server configurations
- `databases.json` - Database configurations
- `gitusers.json` - Git user information

### Manager Web Architecture

**Tech Stack**: Next.js 15.5.4 + React 19 + TypeScript + Tailwind CSS 4

**Scripts**:
- Uses polling for file watching in Docker: `WATCHPACK_POLLING=true CHOKIDAR_USEPOLLING=true`

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

**Platform Creation**:
- `platforms/<name>/.env.sample`
- `platforms/<name>/docker/docker-compose*.yml`
- `platforms/<name>/README.md`
- `platforms/<name>/package.json`
- `platforms/<name>/environments/{development,staging,production}/.env`
- `_settings/dockers/.env.<platform-name>` (generated, gitignored)

**Project Creation**:
- `platforms/<platform>/projects/<name>/` (entire project structure)
- `.env` files with port configurations
- `_settings/projects/.env.<platform>.<project>` (generated, gitignored)

## Security Notes

- Passwords and secrets are auto-generated using `openssl rand -hex`
- Settings files in `_settings/` are gitignored (contain sensitive data)
- Never commit `.env` files with real credentials
- Platform settings are stored in `_settings/dockers/.env.<platform-name>`

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
- Manager API reads/writes to these files
- Used by port allocator to track SN assignments
- Format includes metadata section with version and lastUpdated timestamp

## Development Workflow

1. Start manager services to track platforms/projects
2. Create platforms using `cu.sh` (auto-assigns ports and SN)
3. Create projects within platforms using `cp.sh`
4. Each project gets isolated environment with dedicated port ranges
5. Use manager web UI to view/manage all platforms and projects
6. Port conflicts are prevented by automated allocation system

## Testing

Manager API uses Jest for testing:
```bash
cd _manager/api
npm test
```
