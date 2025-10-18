#!/usr/bin/env node

/**
 * Port Allocation System for Docker Platforms
 *
 * Port Range: 21000 - 30000 (9000 ports total)
 * - Platform: 200 ports each (max 45 platforms)
 *   - Platform Common: 20 ports (offsets 0-19)
 *   - Projects: 10 ports each (max 18 projects, offsets 20-199)
 *
 * Port Structure:
 * - Platform Common Ports (offsets 0-19):
 *   - SSH: 0, MySQL: 1, PostgreSQL: 2, n8n: 6
 *   - WordPress: 11, 12, 13
 *   - Next.js blog: 16, 17
 *
 * - Project Ports (10 ports each, starting from offset 20):
 *   - Base: platform_base + 20 + (project_sn * 10)
 *   - Backend: nodejs(0), python(1), graphql(2), rest(3)
 *   - Frontend: nextjs(5), sveltekit(6)
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load root .env file (scripts -> _manager -> dockers -> .env)
const rootEnvPath = path.join(__dirname, '..', '..', '.env');
dotenv.config({ path: rootEnvPath });

// console.log(`process.env.BASE_PLATFORMS_PORT: ${process.env.BASE_PLATFORMS_PORT}`)

// Constants from .env
const BASE_PLATFORMS_PORT = parseInt(process.env.BASE_PLATFORMS_PORT || '21000', 10);
const PORT_RANGE_END = parseInt(process.env.PORT_RANGE_END || '29999', 10);
const PORTS_PER_PLATFORM = parseInt(process.env.PORTS_PER_PLATFORM || '200', 10);
const PORTS_PER_PROJECT = parseInt(process.env.PORTS_PER_PROJECT || '20', 10);
const MAX_PLATFORMS = parseInt(process.env.MAX_PLATFORMS || '45', 10);
const MAX_PROJECTS_PER_PLATFORM = parseInt(process.env.MAX_PROJECTS_PER_PLATFORM || '10', 10);

// Port offset definitions
const PLATFORM_PORT_OFFSETS = {
  ssh: 0,
  mysql: 1,
  postgres: 2,
  n8n: 6,
  wordpress1: 11,
  wordpress2: 12,
  wordpress3: 13,
  nextjsBlog1: 16,
  nextjsBlog2: 17
};

const PROJECT_PORT_OFFSETS = {
  beNodejs: 0,
  bePython: 1,
  apiGraphql: 2,
  apiRest: 3,
  feNextjs: 5,
  feSveltekit: 6
};

/**
 * Calculate base port for a platform
 */
function calculatePlatformBasePort(platformSn) {
  if (platformSn < 0 || platformSn >= MAX_PLATFORMS) {
    throw new Error(`Platform SN must be between 0 and ${MAX_PLATFORMS - 1}`);
  }
  return BASE_PLATFORMS_PORT + (platformSn * PORTS_PER_PLATFORM);
}

/**
 * Calculate base port for a project
 */
function calculateProjectBasePort(platformSn, projectSn) {
  if (projectSn < 0 || projectSn >= MAX_PROJECTS_PER_PLATFORM) {
    throw new Error(`Project SN must be between 0 and ${MAX_PROJECTS_PER_PLATFORM - 1}`);
  }
  const platformBasePort = calculatePlatformBasePort(platformSn);
  // Projects start at offset 20 (after platform common ports 0-19)
  return platformBasePort + 20 + (projectSn * PORTS_PER_PROJECT);
}

/**
 * Get platform SN by name (if exists) or next available SN
 */
function getPlatformSn(platformsJsonPath, platformName) {
  try {
    const data = JSON.parse(fs.readFileSync(platformsJsonPath, 'utf-8'));
    const platforms = data.platforms || {};

    // Check if platform with this name already exists
    if (platforms[platformName] && platforms[platformName].sn !== undefined) {
      return platforms[platformName].sn;
    }

    // Find max SN for new platform
    let maxSn = -1;
    Object.values(platforms).forEach(platform => {
      if (platform.sn !== undefined && platform.sn > maxSn) {
        maxSn = platform.sn;
      }
    });

    return maxSn + 1;
  } catch (error) {
    // If file doesn't exist or no platforms, start from 0
    return 0;
  }
}

/**
 * Get next available platform SN from platforms.json
 * @deprecated Use getPlatformSn instead
 */
function getNextPlatformSn(platformsJsonPath) {
  try {
    const data = JSON.parse(fs.readFileSync(platformsJsonPath, 'utf-8'));
    const platforms = data.platforms || {};

    // Find max SN
    let maxSn = -1;
    Object.values(platforms).forEach(platform => {
      if (platform.sn !== undefined && platform.sn > maxSn) {
        maxSn = platform.sn;
      }
    });

    return maxSn + 1;
  } catch (error) {
    // If file doesn't exist or no platforms, start from 0
    return 0;
  }
}

/**
 * Get next available project SN for a platform from projects.json
 */
function getNextProjectSn(projectsJsonPath, platformId) {
  try {
    const data = JSON.parse(fs.readFileSync(projectsJsonPath, 'utf-8'));
    const projects = data.projects || {};

    // Find max SN for this platform
    let maxSn = -1;
    Object.values(projects).forEach(project => {
      if (project.platformId === platformId && project.sn !== undefined && project.sn > maxSn) {
        maxSn = project.sn;
      }
    });

    return maxSn + 1;
  } catch (error) {
    // If file doesn't exist or no projects for this platform, start from 0
    return 0;
  }
}

/**
 * Generate port allocation for a platform
 */
function generatePlatformPorts(platformSn) {
  const basePort = calculatePlatformBasePort(platformSn);

  const platformPorts = {};
  Object.entries(PLATFORM_PORT_OFFSETS).forEach(([key, offset]) => {
    platformPorts[key] = {
      port: basePort + offset,
      offset: offset,
      envVar: `PLATFORM_${key.toUpperCase()}_PORT_${platformSn}`
    };
  });

  return {
    sn: platformSn,
    basePort: basePort,
    sshPort: basePort, // SSH port is the platform base port
    portRange: {
      start: basePort,
      end: basePort + PORTS_PER_PLATFORM - 1
    },
    platformPorts: platformPorts,
    projectPortRange: {
      start: basePort + 20,
      end: basePort + 20 + (MAX_PROJECTS_PER_PLATFORM * PORTS_PER_PROJECT) - 1
    },
    envVar: `BASE_PLATFORM_PORT_${platformSn}`,
    maxProjects: MAX_PROJECTS_PER_PLATFORM
  };
}

/**
 * Generate port allocation for a project
 */
function generateProjectPorts(platformSn, projectSn) {
  const basePort = calculateProjectBasePort(platformSn, projectSn);

  const ports = {
    sn: projectSn,
    platformSn: platformSn,
    basePort: basePort,
    portRange: {
      start: basePort,
      end: basePort + PORTS_PER_PROJECT - 1
    },
    envVar: `BASE_PROJECT_PORT_${platformSn}_${projectSn}`,
    projectPorts: {}
  };

  // Generate project ports
  Object.entries(PROJECT_PORT_OFFSETS).forEach(([key, offset]) => {
    const port = basePort + offset;
    const envVarName = generateEnvVarName(key, platformSn, projectSn);
    ports.projectPorts[key] = {
      port: port,
      offset: offset,
      envVar: envVarName
    };
  });

  return ports;
}

/**
 * Generate environment variable name
 */
function generateEnvVarName(portType, platformSn, projectSn) {
  const typeMap = {
    beNodejs: 'BE_NODEJS',
    bePython: 'BE_PYTHON',
    apiGraphql: 'API_GRAPHQL',
    apiRest: 'API_REST',
    feNextjs: 'FE_NEXTJS',
    feSveltekit: 'FE_SVELTE'
  };

  const typeName = typeMap[portType] || portType.toUpperCase();
  return `${typeName}_PORT_${platformSn}_${projectSn}`;
}

/**
 * Generate .env content for a project
 */
function generateEnvFile(projectPorts, platformName, projectName, options = {}) {
  const { platformSn, projectSn, basePort } = projectPorts;
  const lines = [
    '#------------------------------------------------------------------------------',
    '# Port Configuration',
    `# Platform: ${platformName} (SN: ${platformSn})`,
    `# Project: ${projectName} (SN: ${projectSn})`,
    `# Base Port: ${basePort}`,
    `# Port Range: ${basePort} - ${basePort + PORTS_PER_PROJECT - 1}`,
    '#------------------------------------------------------------------------------',
    '',
    `# Base Port Variables`,
    `BASE_PLATFORM_PORT_${platformSn}=${calculatePlatformBasePort(platformSn)}`,
    `BASE_PROJECT_PORT_${platformSn}_${projectSn}=${basePort}`,
    '',
    '#------------------------------------------------------------------------------',
    '# Project Ports (10 ports total)',
    '#------------------------------------------------------------------------------',
    ''
  ];

  // Project ports
  Object.entries(projectPorts.projectPorts).forEach(([key, portInfo]) => {
    const description = getPortDescription(key);
    lines.push(`# ${description}`);
    lines.push(`${portInfo.envVar}=${portInfo.port}`);
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Get port description
 */
function getPortDescription(portType) {
  const descriptions = {
    beNodejs: 'Backend (Node.js)',
    bePython: 'Backend (Python)',
    apiGraphql: 'API (GraphQL)',
    apiRest: 'API (REST)',
    feNextjs: 'Frontend (Next.js)',
    feSveltekit: 'Frontend (SvelteKit)'
  };

  return descriptions[portType] || portType;
}

/**
 * Validate port allocation
 */
function validatePortAllocation(platformSn, projectSn, offset) {
  const basePort = calculateProjectBasePort(platformSn, projectSn);
  const port = basePort + offset;

  if (port < BASE_PLATFORMS_PORT || port > PORT_RANGE_END) {
    return { isValid: false, error: 'Port out of range' };
  }

  if (offset < 0 || offset >= PORTS_PER_PROJECT) {
    return { isValid: false, error: 'Invalid offset' };
  }

  return { isValid: true };
}

/**
 * CLI Interface
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    console.log(`
Port Allocator Utility

Usage:
  node port-allocator.js <command> [options]

Commands:
  platform <sn>                    - Calculate platform port allocation
  project <platform-sn> <project-sn> - Calculate project port allocation
  get-platform-sn <platforms-json> <platform-name> - Get platform SN (existing or next available)
  next-platform <platforms-json>   - Get next available platform SN (deprecated)
  next-project <projects-json> <platform-id> - Get next available project SN
  generate-env <platform-sn> <project-sn> <platform-name> <project-name> - Generate .env content
  validate <platform-sn> <project-sn> <offset> - Validate port allocation

Examples:
  node port-allocator.js platform 0
  node port-allocator.js project 0 0
  node port-allocator.js get-platform-sn /path/to/platforms.json ubuntu-ilmac
  node port-allocator.js next-platform /path/to/platforms.json
  node port-allocator.js generate-env 0 0 ubuntu-ilmac my-project
    `);
    process.exit(0);
  }

  try {
    switch (command) {
      case 'platform': {
        const sn = parseInt(args[1]);
        const result = generatePlatformPorts(sn);
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case 'project': {
        const platformSn = parseInt(args[1]);
        const projectSn = parseInt(args[2]);
        const result = generateProjectPorts(platformSn, projectSn);
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case 'get-platform-sn': {
        const platformsJson = args[1];
        const platformName = args[2];
        const sn = getPlatformSn(platformsJson, platformName);
        console.log(sn);
        break;
      }

      case 'next-platform': {
        const platformsJson = args[1];
        const sn = getNextPlatformSn(platformsJson);
        console.log(sn);
        break;
      }

      case 'next-project': {
        const projectsJson = args[1];
        const platformId = args[2];
        const sn = getNextProjectSn(projectsJson, platformId);
        console.log(sn);
        break;
      }

      case 'generate-env': {
        const platformSn = parseInt(args[1]);
        const projectSn = parseInt(args[2]);
        const platformName = args[3];
        const projectName = args[4];
        const ports = generateProjectPorts(platformSn, projectSn);
        const envContent = generateEnvFile(ports, platformName, projectName);
        console.log(envContent);
        break;
      }

      case 'validate': {
        const platformSn = parseInt(args[1]);
        const projectSn = parseInt(args[2]);
        const offset = parseInt(args[3]);
        const result = validatePortAllocation(platformSn, projectSn, offset);
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        console.error('Use --help for usage information');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run CLI if executed directly
if (require.main === module) {
  main();
}

// Export for use as module
module.exports = {
  calculatePlatformBasePort,
  calculateProjectBasePort,
  generatePlatformPorts,
  generateProjectPorts,
  generateEnvFile,
  validatePortAllocation,
  getPlatformSn,
  getNextPlatformSn,
  getNextProjectSn,
  PLATFORM_PORT_OFFSETS,
  PROJECT_PORT_OFFSETS,
  BASE_PLATFORMS_PORT,
  PORTS_PER_PLATFORM,
  PORTS_PER_PROJECT
};
