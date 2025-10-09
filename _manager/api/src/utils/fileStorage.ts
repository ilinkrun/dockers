import fs from 'fs/promises';
import path from 'path';
import { Platform, Project } from '../types';

const DATA_DIR = path.join(__dirname, '../../../data');
const PLATFORMS_FILE = path.join(DATA_DIR, 'platforms.json');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');

export class FileStorage {
  // Platform operations
  static async getPlatforms(): Promise<{ metadata: any; platforms: Record<string, Platform> }> {
    try {
      const data = await fs.readFile(PLATFORMS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return { metadata: { version: '1.0.0', lastUpdated: new Date().toISOString(), totalPlatforms: 0 }, platforms: {} };
    }
  }

  static async savePlatforms(data: { metadata: any; platforms: Record<string, Platform> }): Promise<void> {
    data.metadata.lastUpdated = new Date().toISOString();
    data.metadata.totalPlatforms = Object.keys(data.platforms).length;
    await fs.writeFile(PLATFORMS_FILE, JSON.stringify(data, null, 2));
  }

  static async addPlatform(platform: Platform): Promise<void> {
    const data = await this.getPlatforms();
    data.platforms[platform.id] = platform;
    await this.savePlatforms(data);
  }

  static async updatePlatform(id: string, updates: Partial<Platform>): Promise<Platform | null> {
    const data = await this.getPlatforms();
    if (!data.platforms[id]) return null;

    data.platforms[id] = { ...data.platforms[id], ...updates, updatedAt: new Date().toISOString() };
    await this.savePlatforms(data);
    return data.platforms[id];
  }

  static async deletePlatform(id: string): Promise<boolean> {
    const data = await this.getPlatforms();
    if (!data.platforms[id]) return false;

    delete data.platforms[id];
    await this.savePlatforms(data);
    return true;
  }

  // Project operations
  static async getProjects(): Promise<{ metadata: any; projects: Record<string, Project> }> {
    try {
      const data = await fs.readFile(PROJECTS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return { metadata: { version: '1.0.0', lastUpdated: new Date().toISOString(), totalProjects: 0 }, projects: {} };
    }
  }

  static async saveProjects(data: { metadata: any; projects: Record<string, Project> }): Promise<void> {
    data.metadata.lastUpdated = new Date().toISOString();
    data.metadata.totalProjects = Object.keys(data.projects).length;
    await fs.writeFile(PROJECTS_FILE, JSON.stringify(data, null, 2));
  }

  static async addProject(project: Project): Promise<void> {
    const data = await this.getProjects();
    data.projects[project.id] = project;
    await this.saveProjects(data);

    // Update platform project count
    const platformData = await this.getPlatforms();
    if (platformData.platforms[project.platformId]) {
      platformData.platforms[project.platformId].projectIds.push(project.id);
      platformData.platforms[project.platformId].projectCount = platformData.platforms[project.platformId].projectIds.length;
      await this.savePlatforms(platformData);
    }
  }

  static async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    const data = await this.getProjects();
    if (!data.projects[id]) return null;

    data.projects[id] = { ...data.projects[id], ...updates, updatedAt: new Date().toISOString() };
    await this.saveProjects(data);
    return data.projects[id];
  }

  static async deleteProject(id: string): Promise<boolean> {
    const data = await this.getProjects();
    if (!data.projects[id]) return false;

    const project = data.projects[id];
    delete data.projects[id];
    await this.saveProjects(data);

    // Update platform project count
    const platformData = await this.getPlatforms();
    if (platformData.platforms[project.platformId]) {
      platformData.platforms[project.platformId].projectIds =
        platformData.platforms[project.platformId].projectIds.filter(pid => pid !== id);
      platformData.platforms[project.platformId].projectCount =
        platformData.platforms[project.platformId].projectIds.length;
      await this.savePlatforms(platformData);
    }

    return true;
  }

  // Utility methods
  static async ensureDataDirectory(): Promise<void> {
    try {
      await fs.access(DATA_DIR);
    } catch {
      await fs.mkdir(DATA_DIR, { recursive: true });
    }
  }
}