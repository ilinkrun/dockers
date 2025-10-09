import { v4 as uuidv4 } from 'uuid';
import { Platform, CreatePlatformRequest } from '../types';
import { FileStorage } from '../utils/fileStorage';
import { generatePassword, generateSecretKey, generatePlatformVolumePaths } from '../utils/helpers';
import { getNextPlatformSn, calculatePlatformPorts } from './portService';

export class PlatformService {
  static async getAllPlatforms(): Promise<Platform[]> {
    const data = await FileStorage.getPlatforms();
    return Object.values(data.platforms);
  }

  static async getPlatformById(id: string): Promise<Platform | null> {
    const data = await FileStorage.getPlatforms();
    return data.platforms[id] || null;
  }

  static async createPlatform(request: CreatePlatformRequest): Promise<Platform> {
    const now = new Date().toISOString();
    const volumes = generatePlatformVolumePaths(request.name);

    // Get next available platform SN and calculate ports
    const platformSn = getNextPlatformSn();
    const portInfo = calculatePlatformPorts(platformSn);

    const platform: Platform = {
      id: request.name,
      sn: platformSn,
      name: request.name,
      description: request.description || '',
      githubUser: request.githubUser,
      createdAt: now,
      updatedAt: now,
      status: 'active',
      settings: {
        basePort: portInfo.basePort,
        portIncrement: 10,
        network: {
          subnet: '172.20.0.0/16',
          gateway: '172.20.0.1'
        },
        database: {
          defaultType: 'postgresql',
          mysql: {
            host: 'mysql-server',
            port: 3306,
            rootPassword: generatePassword(32)
          },
          postgresql: {
            host: 'postgres-server',
            port: 5432,
            superPassword: generatePassword(32)
          }
        },
        security: {
          jwtSecretSalt: generateSecretKey(64),
          encryptionKey: generateSecretKey(64)
        },
        volumes: volumes
      },
      projectCount: 0,
      projectIds: []
    };

    await FileStorage.addPlatform(platform);
    return platform;
  }

  static async updatePlatform(id: string, updates: Partial<Platform>): Promise<Platform | null> {
    return await FileStorage.updatePlatform(id, updates);
  }

  static async deletePlatform(id: string): Promise<boolean> {
    // Check if platform has projects
    const platform = await this.getPlatformById(id);
    if (!platform) return false;

    if (platform.projectCount > 0) {
      throw new Error('Cannot delete platform with existing projects');
    }

    return await FileStorage.deletePlatform(id);
  }

  static async getPlatformProjects(platformId: string): Promise<string[]> {
    const platform = await this.getPlatformById(platformId);
    return platform?.projectIds || [];
  }
}