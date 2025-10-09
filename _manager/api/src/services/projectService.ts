import { v4 as uuidv4 } from 'uuid';
import { Project, CreateProjectRequest, Platform } from '../types';
import { FileStorage } from '../utils/fileStorage';
import crypto from 'crypto';
import {
  generateDatabaseName,
  generateDatabaseUser,
  generatePassword,
  generateSecretKey,
  generateDockerNetwork,
  generateDockerImageName,
  generateProjectVolumePaths,
  calculateProjectPorts,
  getNextProjectIndex
} from '../utils/helpers';
import { PlatformService } from './platformService';
import {
  getNextProjectSn,
  calculateProjectPorts as calculatePortAllocation,
  generateProjectPortsConfig,
  getPlatformSn
} from './portService';

export class ProjectService {
  static async getAllProjects(): Promise<Project[]> {
    const data = await FileStorage.getProjects();
    return Object.values(data.projects);
  }

  static async getProjectById(id: string): Promise<Project | null> {
    const data = await FileStorage.getProjects();
    return data.projects[id] || null;
  }

  static async getProjectsByPlatform(platformId: string): Promise<Project[]> {
    const data = await FileStorage.getProjects();
    return Object.values(data.projects).filter(project => project.platformId === platformId);
  }

  static generatePortFromName(projectName: string, basePort: number = 8000): {
    backend: number;
    graphql: number;
    frontendNextjs: number;
    frontendSveltekit: number;
  } {
    const hash = crypto.createHash('md5').update(projectName).digest('hex');
    const hashNum = parseInt(hash.substring(0, 8), 16);
    const portOffset = (hashNum % 1000) * 10;

    return {
      backend: basePort + portOffset,
      graphql: basePort + portOffset + 1,
      frontendNextjs: basePort + portOffset + 2,
      frontendSveltekit: basePort + portOffset + 3
    };
  }

  static async createProject(request: CreateProjectRequest): Promise<Project> {
    const now = new Date().toISOString();

    // Get platform settings
    const platform = await PlatformService.getPlatformById(request.platformId);
    if (!platform) {
      throw new Error(`Platform ${request.platformId} not found`);
    }

    // Get platform SN
    const platformSn = platform.sn !== undefined ? platform.sn : 0;

    // Get next available project SN for this platform
    const projectSn = getNextProjectSn(request.platformId);

    // Calculate ports using port allocator
    const portInfo = calculatePortAllocation(platformSn, projectSn);
    const ports = generateProjectPortsConfig(portInfo);

    // Generate database settings
    const dbName = generateDatabaseName(request.platformId, request.name);
    const dbUser = generateDatabaseUser(request.platformId, request.name);
    const dbPassword = generatePassword(24);
    const defaultDatabaseSettings = {
      defaultType: 'postgresql' as 'mysql' | 'postgresql',
      mysql: {
        host: 'mysql-server',
        port: 3306,
        rootPassword: generatePassword(24)
      },
      postgresql: {
        host: 'postgres-server',
        port: 5432,
        superPassword: generatePassword(24)
      }
    };

    const databaseSettings = platform.settings?.database ?? defaultDatabaseSettings;
    const dbType = databaseSettings.defaultType ?? 'postgresql';
    const dbConfig =
      dbType === 'mysql'
        ? databaseSettings.mysql ?? defaultDatabaseSettings.mysql
        : databaseSettings.postgresql ?? defaultDatabaseSettings.postgresql;

    // Generate other settings
    const volumes = generateProjectVolumePaths(request.platformId, request.name);
    const dockerNetwork = generateDockerNetwork(request.platformId);

    const project: Project = {
      id: request.name,
      sn: projectSn,
      name: request.name,
      platformId: request.platformId,
      description: request.description || '',
      githubUser: request.githubUser,
      createdAt: now,
      updatedAt: now,
      status: 'development',
      ports,
      database: {
        type: dbType,
        host: dbConfig.host,
        port: dbConfig.port,
        name: dbName,
        user: dbUser,
        password: dbPassword,
        autoCreate: true
      },
      environment: {
        nodeEnv: 'development',
        corsOrigin: `http://localhost:${ports.frontendNextjs}`
      },
      security: {
        jwtSecret: generateSecretKey(64),
        jwtExpiresIn: '7d'
      },
      docker: {
        imageBackend: generateDockerImageName(request.platformId, request.name, 'backend'),
        imageFrontendNextjs: generateDockerImageName(request.platformId, request.name, 'frontend-nextjs'),
        imageFrontendSveltekit: generateDockerImageName(request.platformId, request.name, 'frontend-sveltekit'),
        network: dockerNetwork
      },
      volumes
    };

    await FileStorage.addProject(project);
    return project;
  }

  static async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    return await FileStorage.updateProject(id, updates);
  }

  static async deleteProject(id: string): Promise<boolean> {
    return await FileStorage.deleteProject(id);
  }
}
