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

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}