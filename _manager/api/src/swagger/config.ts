import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Platform Manager API',
      version: '1.0.0',
      description: 'Platform and Project Management API for Docker Platforms',
      contact: {
        name: 'Platform Manager',
        url: 'http://localhost:20101'
      }
    },
    servers: [
      {
        url: 'http://localhost:20101',
        description: 'Development server'
      },
      {
        url: 'http://1.231.118.217:20101',
        description: 'External server'
      }
    ],
    components: {
      schemas: {
        Platform: {
          type: 'object',
          required: ['id', 'name', 'githubUser', 'createdAt', 'updatedAt', 'status'],
          properties: {
            id: {
              type: 'string',
              description: 'Platform unique identifier'
            },
            name: {
              type: 'string',
              description: 'Platform name'
            },
            description: {
              type: 'string',
              description: 'Platform description'
            },
            githubUser: {
              type: 'string',
              description: 'GitHub username'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'archived'],
              description: 'Platform status'
            },
            projectCount: {
              type: 'number',
              description: 'Number of projects in platform'
            },
            projectIds: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of project IDs'
            }
          }
        },
        Project: {
          type: 'object',
          required: ['id', 'name', 'platformId', 'githubUser', 'createdAt', 'updatedAt', 'status'],
          properties: {
            id: {
              type: 'string',
              description: 'Project unique identifier'
            },
            name: {
              type: 'string',
              description: 'Project name'
            },
            platformId: {
              type: 'string',
              description: 'Parent platform ID'
            },
            description: {
              type: 'string',
              description: 'Project description'
            },
            githubUser: {
              type: 'string',
              description: 'GitHub username'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'development', 'production'],
              description: 'Project status'
            },
            ports: {
              type: 'object',
              properties: {
                backend: { type: 'number' },
                graphql: { type: 'number' },
                frontendNextjs: { type: 'number' },
                frontendSveltekit: { type: 'number' }
              }
            }
          }
        },
        CreatePlatformRequest: {
          type: 'object',
          required: ['name', 'githubUser'],
          properties: {
            name: {
              type: 'string',
              description: 'Platform name'
            },
            description: {
              type: 'string',
              description: 'Platform description'
            },
            githubUser: {
              type: 'string',
              description: 'GitHub username'
            }
          }
        },
        CreateProjectRequest: {
          type: 'object',
          required: ['name', 'platformId', 'githubUser'],
          properties: {
            name: {
              type: 'string',
              description: 'Project name'
            },
            platformId: {
              type: 'string',
              description: 'Parent platform ID'
            },
            description: {
              type: 'string',
              description: 'Project description'
            },
            githubUser: {
              type: 'string',
              description: 'GitHub username'
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Request success status'
            },
            data: {
              description: 'Response data'
            },
            error: {
              type: 'string',
              description: 'Error message if any'
            },
            message: {
              type: 'string',
              description: 'Success message if any'
            }
          }
        }
      }
    }
  },
  apis: ['./dist/routes/*.js', './src/routes/*.ts']
};

export const specs = swaggerJsdoc(options);
export { swaggerUi };