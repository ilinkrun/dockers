import { execSync } from "child_process";
import * as path from "path";

const DOCKERS_ROOT =
  process.env.DOCKER_ROOT_PATH || "/var/services/homes/jungsam/dockers";
const PORT_ALLOCATOR = path.join(
  DOCKERS_ROOT,
  "_manager",
  "scripts",
  "port-allocator.js"
);
const PLATFORMS_JSON = path.join(
  DOCKERS_ROOT,
  "_manager",
  "data",
  "platforms.json"
);
const PROJECTS_JSON = path.join(
  DOCKERS_ROOT,
  "_manager",
  "data",
  "projects.json"
);

export interface PlatformPortInfo {
  sn: number;
  basePort: number;
  portRange: {
    start: number;
    end: number;
  };
  envVar: string;
  maxProjects: number;
}

export interface ProjectPortInfo {
  sn: number;
  platformSn: number;
  basePort: number;
  portRange: {
    start: number;
    end: number;
  };
  envVar: string;
  production: {
    [key: string]: {
      port: number;
      offset: number;
      envVar: string;
    };
  };
  development: {
    [key: string]: {
      port: number;
      offset: number;
      envVar: string;
    };
  };
}

/**
 * Get next available platform SN
 */
export function getNextPlatformSn(): number {
  try {
    const result = execSync(
      `node "${PORT_ALLOCATOR}" next-platform "${PLATFORMS_JSON}"`,
      {
        encoding: "utf-8",
      }
    );
    return parseInt(result.trim());
  } catch (error) {
    console.error("Error getting next platform SN:", error);
    return 0;
  }
}

/**
 * Get next available project SN for a platform
 */
export function getNextProjectSn(platformId: string): number {
  try {
    const result = execSync(
      `node "${PORT_ALLOCATOR}" next-project "${PROJECTS_JSON}" "${platformId}"`,
      {
        encoding: "utf-8",
      }
    );
    return parseInt(result.trim());
  } catch (error) {
    console.error("Error getting next project SN:", error);
    return 0;
  }
}

/**
 * Calculate platform port allocation
 */
export function calculatePlatformPorts(platformSn: number): PlatformPortInfo {
  try {
    const result = execSync(`node "${PORT_ALLOCATOR}" platform ${platformSn}`, {
      encoding: "utf-8",
    });
    return JSON.parse(result);
  } catch (error) {
    console.error("Error calculating platform ports:", error);
    throw new Error("Failed to calculate platform ports");
  }
}

/**
 * Calculate project port allocation
 */
export function calculateProjectPorts(
  platformSn: number,
  projectSn: number
): ProjectPortInfo {
  try {
    const result = execSync(
      `node "${PORT_ALLOCATOR}" project ${platformSn} ${projectSn}`,
      {
        encoding: "utf-8",
      }
    );
    return JSON.parse(result);
  } catch (error) {
    console.error("Error calculating project ports:", error);
    throw new Error("Failed to calculate project ports");
  }
}

/**
 * Validate port allocation
 */
export function validatePortAllocation(
  platformSn: number,
  projectSn: number,
  offset: number
): {
  isValid: boolean;
  error?: string;
} {
  try {
    const result = execSync(
      `node "${PORT_ALLOCATOR}" validate ${platformSn} ${projectSn} ${offset}`,
      { encoding: "utf-8" }
    );
    return JSON.parse(result);
  } catch (error) {
    console.error("Error validating port allocation:", error);
    return { isValid: false, error: "Validation failed" };
  }
}

/**
 * Generate project ports from port info
 * Converts port allocator output to the format expected by projects.json
 */
export function generateProjectPortsConfig(portInfo: ProjectPortInfo): {
  backend: number;
  graphql: number;
  frontendNextjs: number;
  frontendSveltekit: number;
  reserved: number[];
} {
  return {
    backend: portInfo.production.beNodejs.port,
    graphql: portInfo.production.apiGraphql.port,
    frontendNextjs: portInfo.production.feNextjs.port,
    frontendSveltekit: portInfo.production.feSveltekit.port,
    reserved: [
      portInfo.production.bePython.port,
      portInfo.production.apiRest.port,
      portInfo.production.apiReserved.port,
      portInfo.production.feReserved.port,
      portInfo.production.sysReserved.port,
    ],
  };
}

/**
 * Get platform SN from platform ID
 */
export function getPlatformSn(platformId: string, platforms: any): number {
  const platform = platforms[platformId];
  if (platform && platform.sn !== undefined) {
    return platform.sn;
  }
  return 0;
}

/**
 * Get project SN from project ID
 */
export function getProjectSn(projectId: string, projects: any): number {
  const project = projects[projectId];
  if (project && project.sn !== undefined) {
    return project.sn;
  }
  return 0;
}
