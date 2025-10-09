import * as crypto from "crypto";

/**
 * Generate database name following the pattern: platform__project_db
 * Converts hyphens to underscores
 * Example: ubuntu-test-1 + my-project -> ubuntu_test_1__my_project_db
 */
export function generateDatabaseName(
  platformName: string,
  projectName: string
): string {
  const sanitizedPlatform = platformName.replace(/-/g, "_");
  const sanitizedProject = projectName.replace(/-/g, "_");
  return `${sanitizedPlatform}__${sanitizedProject}_db`;
}

/**
 * Generate database user name
 * Example: ubuntu-test-1 + my-project -> ubuntu_test_1__my_project_user
 */
export function generateDatabaseUser(
  platformName: string,
  projectName: string
): string {
  const sanitizedPlatform = platformName.replace(/-/g, "_");
  const sanitizedProject = projectName.replace(/-/g, "_");
  return `${sanitizedPlatform}__${sanitizedProject}_user`;
}

/**
 * Parse database name to extract platform and project names
 * Example: ubuntu_test_1__my_project_db -> { platform: 'ubuntu-test-1', project: 'my-project' }
 */
export function parseDatabaseName(
  dbName: string
): { platform: string; project: string } | null {
  const match = dbName.match(/^(.+)__(.+)_db$/);
  if (!match) return null;

  return {
    platform: match[1].replace(/_/g, "-"),
    project: match[2].replace(/_/g, "-"),
  };
}

/**
 * Calculate project ports based on platform base port and project index
 * Each project reserves portIncrement ports (default: 10)
 */
export function calculateProjectPorts(
  basePort: number,
  projectIndex: number,
  portIncrement: number = 10
): {
  backend: number;
  graphql: number;
  frontendNextjs: number;
  frontendSveltekit: number;
  reserved: number[];
} {
  const startPort = basePort + projectIndex * portIncrement;

  return {
    backend: startPort,
    graphql: startPort + 1,
    frontendNextjs: startPort + 2,
    frontendSveltekit: startPort + 3,
    reserved: Array.from(
      { length: portIncrement - 4 },
      (_, i) => startPort + 4 + i
    ),
  };
}

/**
 * Check if ports are already in use by other projects
 */
export function checkPortConflicts(
  newPorts: number[],
  existingProjects: Array<{
    ports: {
      backend: number;
      graphql: number;
      frontendNextjs: number;
      frontendSveltekit: number;
      reserved?: number[];
    };
  }>
): { hasConflict: boolean; conflictingPorts: number[] } {
  const usedPorts = new Set<number>();

  existingProjects.forEach((project) => {
    usedPorts.add(project.ports.backend);
    usedPorts.add(project.ports.graphql);
    usedPorts.add(project.ports.frontendNextjs);
    usedPorts.add(project.ports.frontendSveltekit);
    project.ports.reserved?.forEach((port) => usedPorts.add(port));
  });

  const conflictingPorts = newPorts.filter((port) => usedPorts.has(port));

  return {
    hasConflict: conflictingPorts.length > 0,
    conflictingPorts,
  };
}

/**
 * Generate random password
 */
export function generatePassword(length: number = 24): string {
  return crypto.randomBytes(length).toString("hex").slice(0, length);
}

/**
 * Generate random secret key
 */
export function generateSecretKey(length: number = 64): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Generate Docker network name
 */
export function generateDockerNetwork(platformName: string): string {
  return `${platformName}_network`;
}

/**
 * Generate Docker image name
 */
export function generateDockerImageName(
  platformName: string,
  projectName: string,
  service: "backend" | "frontend-nextjs" | "frontend-sveltekit"
): string {
  return `${platformName}/${projectName}-${service}`;
}

/**
 * Generate volume paths for platform
 */
export function generatePlatformVolumePaths(platformName: string): {
  dataPath: string;
  logsPath: string;
  backupsPath: string;
} {
  const basePath = `/var/services/homes/jungsam/dockers/${platformName}`;
  return {
    dataPath: `${basePath}/data`,
    logsPath: `${basePath}/logs`,
    backupsPath: `${basePath}/backups`,
  };
}

/**
 * Generate volume paths for project
 */
export function generateProjectVolumePaths(
  platformName: string,
  projectName: string
): {
  dataPath: string;
  logsPath: string;
  uploadsPath: string;
} {
  const basePath = `/var/services/homes/jungsam/dockers/${platformName}/projects/${projectName}`;
  return {
    dataPath: `${basePath}/data`,
    logsPath: `${basePath}/logs`,
    uploadsPath: `${basePath}/uploads`,
  };
}

/**
 * Get next available project index for a platform
 */
export function getNextProjectIndex(
  platformProjects: Array<{ ports: { backend: number } }>,
  basePort: number,
  portIncrement: number
): number {
  if (platformProjects.length === 0) return 0;

  // Find the highest port and calculate index
  const maxBackendPort = Math.max(
    ...platformProjects.map((p) => p.ports.backend)
  );
  const currentMaxIndex = Math.floor(
    (maxBackendPort - basePort) / portIncrement
  );

  return currentMaxIndex + 1;
}
