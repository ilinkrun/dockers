# Port Allocation System - Usage Guide

## Overview

This directory contains the port allocation system for Docker platforms. The system automatically assigns ports to platforms and projects following a structured allocation scheme.

## Port Allocation Rules

- **Total Port Range**: 11000 - 19999 (9000 ports)
- **Platform Allocation**: 200 ports per platform (max 45 platforms)
- **Project Allocation**: 20 ports per project (max 10 projects per platform)

### Port Structure per Project (20 ports)

#### PRODUCTION (Offsets 0-9)
- 0: SSH
- 1: Backend (Node.js)
- 2: Backend (Python)
- 3: API (GraphQL)
- 4: API (REST)
- 5: API (Reserved)
- 6: Frontend (Next.js)
- 7: Frontend (SvelteKit)
- 8: Frontend (Reserved)
- 9: System Reserved

#### DEVELOPMENT (Offsets 10-19)
- Same as PRODUCTION but with +10 offset

## Scripts

### port-allocator.js

Main port allocation utility script.

#### Commands

##### 1. Get Platform Port Allocation

```bash
node port-allocator.js platform <platform-sn>
```

**Example:**
```bash
node port-allocator.js platform 0
```

**Output:**
```json
{
  "sn": 0,
  "basePort": 11000,
  "portRange": {
    "start": 11000,
    "end": 11199
  },
  "envVar": "BASE_PLATFORM_PORT_0",
  "maxProjects": 10
}
```

##### 2. Get Project Port Allocation

```bash
node port-allocator.js project <platform-sn> <project-sn>
```

**Example:**
```bash
node port-allocator.js project 0 0
```

**Output:**
```json
{
  "sn": 0,
  "platformSn": 0,
  "basePort": 11000,
  "portRange": {
    "start": 11000,
    "end": 11019
  },
  "production": {
    "ssh": { "port": 11000, "offset": 0, "envVar": "SSH_PORT_0_0_PROD" },
    "beNodejs": { "port": 11001, "offset": 1, "envVar": "BE_NODEJS_PORT_0_0_PROD" },
    ...
  },
  "development": {
    ...
  }
}
```

##### 3. Get Next Available Platform SN

```bash
node port-allocator.js next-platform <platforms-json-path>
```

**Example:**
```bash
node port-allocator.js next-platform /var/services/homes/jungsam/dockers/_manager/data/platforms.json
```

**Output:**
```
2
```

##### 4. Get Next Available Project SN

```bash
node port-allocator.js next-project <projects-json-path> <platform-id>
```

**Example:**
```bash
node port-allocator.js next-project /var/services/homes/jungsam/dockers/_manager/data/projects.json ubuntu-ilmac
```

##### 5. Generate .env Content for a Project

```bash
node port-allocator.js generate-env <platform-sn> <project-sn> <platform-name> <project-name>
```

**Example:**
```bash
node port-allocator.js generate-env 0 0 ubuntu-ilmac my-project
```

**Output:**
```env
#------------------------------------------------------------------------------
# Port Configuration
# Platform: ubuntu-ilmac (SN: 0)
# Project: my-project (SN: 0)
# Base Port: 11000
# Port Range: 11000 - 11019
#------------------------------------------------------------------------------

# Base Port Variables
BASE_PLATFORM_PORT_0=11000
BASE_PROJECT_PORT_0_0=11000

#------------------------------------------------------------------------------
# PRODUCTION Ports (Offsets: 0-9)
#------------------------------------------------------------------------------

# SSH Server
SSH_PORT_0_0_PROD=11000

# Backend (Node.js)
BE_NODEJS_PORT_0_0_PROD=11001

...
```

##### 6. Validate Port Allocation

```bash
node port-allocator.js validate <platform-sn> <project-sn> <offset>
```

**Example:**
```bash
node port-allocator.js validate 0 0 5
```

## Integration with cu.sh

The port allocation system is automatically integrated into the platform creation script (`cu.sh`).

### How It Works

1. When creating a new platform, `cu.sh` calls `port-allocator.js` to get the next available platform SN
2. The base port is calculated: `11000 + (platform_sn * 200)`
3. Platform SN and base port are substituted into:
   - `.env` file
   - `docker-compose.yml` files
   - Other configuration files

### Modified cu.sh Variables

The following variables are now available in cu.sh and template files:

- `${PLATFORM_SN}` - Platform serial number (0, 1, 2, ...)
- `${BASE_PLATFORM_PORT}` - Platform base port (11000, 11200, 11400, ...)

### Example Platform Creation

```bash
./cu.sh -n my-platform -u myuser -d "My Platform Description"
```

**Output:**
```
Calculating port allocation...
  Platform SN: 2
  Base Port: 11400
  Port Range: 11400 - 11599

✓ Platform settings created: /var/services/homes/jungsam/dockers/_settings/dockers/.env.my-platform
  Platform SN: 2
  Base Port: 11400
```

## Environment Variable Naming Convention

All port environment variables follow this pattern:

```
{TYPE}_{SUBTYPE}_PORT_{PLATFORM_SN}_{PROJECT_SN}_{ENV}
```

**Examples:**
- `SSH_PORT_0_0_PROD` - Production SSH port for Platform 0, Project 0
- `BE_NODEJS_PORT_0_0_DEV` - Development Node.js backend port
- `API_GRAPHQL_PORT_1_2_PROD` - Production GraphQL API port for Platform 1, Project 2
- `FE_NEXTJS_PORT_2_0_DEV` - Development Next.js frontend port for Platform 2, Project 0

## Project Port Generation

For project creation, use the port allocator to generate project-specific port configurations:

### Example: Create Project Port Configuration

```bash
#!/bin/bash

PLATFORM_SN=0
PROJECT_SN=0
PLATFORM_NAME="ubuntu-ilmac"
PROJECT_NAME="my-project"

# Generate .env content for the project
node /var/services/homes/jungsam/dockers/_scripts/port-allocator.js \
  generate-env $PLATFORM_SN $PROJECT_SN $PLATFORM_NAME $PROJECT_NAME \
  > /path/to/project/.env.ports

# Append to existing .env or use separately
cat /path/to/project/.env.ports >> /path/to/project/.env
```

## Port Allocation Examples

### Example 1: Platform 0, Project 0

- **Platform Base Port**: 11000
- **Project Base Port**: 11000
- **Production Ports**: 11000-11009
- **Development Ports**: 11010-11019

### Example 2: Platform 1, Project 3

- **Platform Base Port**: 11200 (11000 + 1*200)
- **Project Base Port**: 11260 (11200 + 3*20)
- **Production Ports**: 11260-11269
- **Development Ports**: 11270-11279

### Example 3: Platform 3, Project 5

- **Platform Base Port**: 11600 (11000 + 3*200)
- **Project Base Port**: 11700 (11600 + 5*20)
- **Production Ports**: 11700-11709
- **Development Ports**: 11710-11719

## Troubleshooting

### Port Conflicts

If you encounter port conflicts, use the validate command:

```bash
node port-allocator.js validate <platform-sn> <project-sn> <offset>
```

### Missing Platform SN

If platforms.json doesn't have SN information, the allocator starts from 0 and increments automatically.

### Manual Port Allocation

If you need to manually set ports, you can still do so, but ensure they don't conflict with the automatic allocation system by checking the allocated ranges.

## Files Modified

1. **`/var/services/homes/jungsam/dockers/_scripts/port-allocator.js`** - Main utility script
2. **`/var/services/homes/jungsam/dockers/cu.sh`** - Platform creation script (integrated)
3. **`/var/services/homes/jungsam/dockers/_templates/docker-ubuntu/.env.sample`** - Template updated with port documentation

## Best Practices

1. **Always use the port allocator** - Don't manually assign ports
2. **Check next available SN** before creating platforms/projects
3. **Document custom port usage** if deviating from the system
4. **Use environment variables** in docker-compose files instead of hardcoded ports
5. **Reserve ports** by marking them in the system (use reserved offsets 5, 8, 9, 15, 18, 19)

## See Also

- [PORT 관리시스템.md](/var/services/homes/jungsam/dockers/jnj-ubuntu/projects/jnj-dev/docs/PORT%20관리시스템.md) - Detailed port allocation specification
- `cu.sh` - Platform creation script
- `cp.sh` - Project creation script (to be updated)
