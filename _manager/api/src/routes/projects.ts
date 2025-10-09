import { Router, Request, Response } from 'express';
import { ProjectService } from '../services/projectService';
import { CreateProjectRequest, ApiResponse } from '../types';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management endpoints
 */

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: List of all projects
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProjectRequest'
 *           example:
 *             name: "my-project"
 *             platformId: "my-platform"
 *             description: "My development project"
 *             githubUser: "myuser"
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Bad request
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const projects = await ProjectService.getAllProjects();
    const response: ApiResponse = {
      success: true,
      data: projects
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(response);
  }
});

// GET /api/projects/:id - Get project by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const project = await ProjectService.getProjectById(req.params.id);
    if (!project) {
      const response: ApiResponse = {
        success: false,
        error: 'Project not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: project
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(response);
  }
});

// POST /api/projects - Create new project
router.post('/', async (req: Request, res: Response) => {
  try {
    const request: CreateProjectRequest = req.body;

    if (!request.name || !request.platformId || !request.githubUser) {
      const response: ApiResponse = {
        success: false,
        error: 'Name, platformId, and githubUser are required'
      };
      return res.status(400).json(response);
    }

    const project = await ProjectService.createProject(request);
    const response: ApiResponse = {
      success: true,
      data: project,
      message: 'Project created successfully'
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(response);
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const project = await ProjectService.updateProject(req.params.id, req.body);
    if (!project) {
      const response: ApiResponse = {
        success: false,
        error: 'Project not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: project,
      message: 'Project updated successfully'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(response);
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await ProjectService.deleteProject(req.params.id);
    if (!deleted) {
      const response: ApiResponse = {
        success: false,
        error: 'Project not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Project deleted successfully'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(response);
  }
});

export default router;