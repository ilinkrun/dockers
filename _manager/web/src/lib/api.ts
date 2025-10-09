const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:20101';

export interface Platform {
  id: string;
  sn?: number;
  name: string;
  description?: string;
  githubUser: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive' | 'archived';
  settings: {
    basePort: number;
    portIncrement: number;
    network: {
      subnet: string;
      gateway: string;
    };
    database: {
      defaultType: 'mysql' | 'postgresql';
      mysqlId?: string;
      postgresqlId?: string;
      mysql: {
        host: string;
        port: number;
        rootPassword: string;
      };
      postgresql: {
        host: string;
        port: number;
        superPassword: string;
      };
    };
    security: {
      jwtSecretSalt: string;
      encryptionKey: string;
    };
    volumes: {
      dataPath: string;
      logsPath: string;
      backupsPath: string;
    };
  };
  projectCount: number;
  projectIds: string[];
}

export interface Project {
  id: string;
  sn?: number;
  name: string;
  platformId: string;
  description?: string;
  githubUser: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive' | 'development' | 'production';
  ports: {
    backend: number;
    graphql: number;
    frontendNextjs: number;
    frontendSveltekit: number;
    reserved?: number[];
  };
  database: {
    type: 'mysql' | 'postgresql';
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    autoCreate: boolean;
  };
  environment: {
    nodeEnv: 'development' | 'staging' | 'production';
    corsOrigin: string;
  };
  security: {
    jwtSecret: string;
    jwtExpiresIn: string;
  };
  docker: {
    imageBackend: string;
    imageFrontendNextjs: string;
    imageFrontendSveltekit: string;
    network: string;
  };
  volumes: {
    dataPath: string;
    logsPath: string;
    uploadsPath: string;
  };
}

export interface CreatePlatformRequest {
  name: string;
  description?: string;
  githubUser: string;
}

export interface CreateProjectRequest {
  name: string;
  platformId: string;
  description?: string;
  githubUser: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const result: ApiResponse<T> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      if (!result.success) {
        throw new Error(result.error || 'API request failed');
      }

      return result.data as T;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Platform methods
  async getPlatforms(): Promise<Platform[]> {
    return this.request<Platform[]>('/api/platforms');
  }

  async getPlatform(id: string): Promise<Platform> {
    return this.request<Platform>(`/api/platforms/${id}`);
  }

  async createPlatform(data: CreatePlatformRequest): Promise<Platform> {
    return this.request<Platform>('/api/platforms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePlatform(id: string, data: Partial<Platform>): Promise<Platform> {
    return this.request<Platform>(`/api/platforms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePlatform(id: string): Promise<void> {
    return this.request<void>(`/api/platforms/${id}`, {
      method: 'DELETE',
    });
  }

  // Project methods
  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/api/projects');
  }

  async getProject(id: string): Promise<Project> {
    return this.request<Project>(`/api/projects/${id}`);
  }

  async getProjectsByPlatform(platformId: string): Promise<Project[]> {
    return this.request<Project[]>(`/api/platforms/${platformId}/projects`);
  }

  async createProject(data: CreateProjectRequest): Promise<Project> {
    return this.request<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    return this.request<Project>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string): Promise<void> {
    return this.request<void>(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check (special case - doesn't use ApiResponse wrapper)
  async healthCheck(): Promise<{ status: string; timestamp: string; version: string }> {
    const url = `${this.baseUrl}/health`;
    const response = await fetch(url);
    return await response.json();
  }

  // Script execution
  async createPlatformScript(data: { name: string; githubUser: string; description?: string }): Promise<{ stdout: string; stderr: string; message: string }> {
    return this.request<{ stdout: string; stderr: string; message: string }>('/api/scripts/create-platform', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createProjectScript(data: { platformId: string; platformName: string; name: string; githubUser: string; description?: string }): Promise<{ stdout: string; stderr: string; message: string }> {
    return this.request<{ stdout: string; stderr: string; message: string }>('/api/scripts/create-project', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deletePlatformScript(data: { name: string; githubUser: string }): Promise<{ stdout: string; stderr: string; message: string }> {
    return this.request<{ stdout: string; stderr: string; message: string }>('/api/scripts/delete-platform', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteProjectScript(data: { platformId: string; name: string; githubUser: string }): Promise<{ stdout: string; stderr: string; message: string }> {
    return this.request<{ stdout: string; stderr: string; message: string }>('/api/scripts/delete-project', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // GitUsers methods
  async getGitUsers(): Promise<string[]> {
    return this.request<string[]>('/api/gitusers');
  }

  async getGitUsersDetailed(): Promise<GitUserDetailed[]> {
    return this.request<GitUserDetailed[]>('/api/gitusers?detail=true');
  }

  async getGitUser(username: string): Promise<GitUserDetailed> {
    return this.request<GitUserDetailed>(`/api/gitusers/${username}`);
  }

  async createGitUser(data: { username: string } & Omit<GitUser, 'token2' | 'expired'> & Partial<Pick<GitUser, 'token2' | 'expired'>>): Promise<GitUserDetailed> {
    return this.request<GitUserDetailed>('/api/gitusers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGitUser(username: string, data: Partial<GitUser>): Promise<GitUserDetailed> {
    return this.request<GitUserDetailed>(`/api/gitusers/${username}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteGitUser(username: string): Promise<void> {
    return this.request<void>(`/api/gitusers/${username}`, {
      method: 'DELETE',
    });
  }

  // Database methods
  async getDatabases(): Promise<{ mysqls: DatabaseConfig[]; postgresqls: DatabaseConfig[] }> {
    return this.request<{ mysqls: DatabaseConfig[]; postgresqls: DatabaseConfig[] }>('/api/databases');
  }

  async getMysqlDatabases(): Promise<DatabaseConfig[]> {
    return this.request<DatabaseConfig[]>('/api/databases/mysql');
  }

  async getPostgresqlDatabases(): Promise<DatabaseConfig[]> {
    return this.request<DatabaseConfig[]>('/api/databases/postgresql');
  }

  async createDatabase(data: { type: 'mysql' | 'postgresql' } & Omit<DatabaseConfig, 'id'>): Promise<DatabaseConfig> {
    return this.request<DatabaseConfig>('/api/databases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDatabase(type: 'mysql' | 'postgresql', id: string, data: Partial<DatabaseConfig>): Promise<DatabaseConfig> {
    return this.request<DatabaseConfig>(`/api/databases/${type}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDatabase(type: 'mysql' | 'postgresql', id: string): Promise<void> {
    return this.request<void>(`/api/databases/${type}/${id}`, {
      method: 'DELETE',
    });
  }

  // Server template methods
  async getServerTemplates(): Promise<{ backend: ServerTemplate[]; graphql: ServerTemplate[]; frontend: ServerTemplate[]; all: ServerTemplate[] }> {
    return this.request<{ backend: ServerTemplate[]; graphql: ServerTemplate[]; frontend: ServerTemplate[]; all: ServerTemplate[] }>('/api/servers/templates');
  }

  async getServerTemplatesByType(type: 'backend' | 'graphql' | 'frontend'): Promise<ServerTemplate[]> {
    return this.request<ServerTemplate[]>(`/api/servers/templates/${type}`);
  }

  async createServerTemplate(data: ServerTemplate): Promise<ServerTemplate> {
    return this.request<ServerTemplate>('/api/servers/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateServerTemplate(type: 'backend' | 'graphql' | 'frontend', id: string, data: Partial<ServerTemplate>): Promise<ServerTemplate> {
    return this.request<ServerTemplate>(`/api/servers/templates/${type}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteServerTemplate(type: 'backend' | 'graphql' | 'frontend', id: string): Promise<void> {
    return this.request<void>(`/api/servers/templates/${type}/${id}`, {
      method: 'DELETE',
    });
  }

  // Project server methods
  async getProjectServers(): Promise<ProjectServer[]> {
    return this.request<ProjectServer[]>('/api/servers/project-servers');
  }

  async getProjectServersByProjectId(projectId: string): Promise<ProjectServers> {
    return this.request<ProjectServers>(`/api/servers/project-servers/${projectId}`);
  }

  async createProjectServer(data: {
    projectId: string;
    platformId: string;
    type: 'backend' | 'graphql' | 'frontend';
    templateId: string;
    port: number;
    enabled?: boolean;
    config?: Record<string, unknown>;
  }): Promise<ProjectServer> {
    return this.request<ProjectServer>('/api/servers/project-servers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProjectServer(projectId: string, serverId: string, data: {
    port?: number;
    enabled?: boolean;
    config?: Record<string, unknown>;
    templateId?: string;
  }): Promise<ProjectServer> {
    return this.request<ProjectServer>(`/api/servers/project-servers/${projectId}/${serverId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProjectServer(projectId: string, serverId: string): Promise<void> {
    return this.request<void>(`/api/servers/project-servers/${projectId}/${serverId}`, {
      method: 'DELETE',
    });
  }
}

export interface DatabaseConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  user: string;
  password: string;
  description: string;
}

export interface GitUser {
  fullName: string;
  email: string;
  token: string;
  token2?: string;
  expired?: string;
}

export interface GitUserDetailed extends GitUser {
  username: string;
}

export interface ServerTemplate {
  id: string;
  name: string;
  type: 'backend' | 'graphql' | 'frontend';
  framework: string;
  language: string;
  description: string;
  features: string[];
}

export interface ProjectServer {
  id: string;
  projectId: string;
  platformId: string;
  type: 'backend' | 'graphql' | 'frontend';
  templateId: string;
  port: number;
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface ProjectServers {
  projectId: string;
  platformId: string;
  servers: ProjectServer[];
}

export const apiClient = new ApiClient();