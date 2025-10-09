import { Router, Request, Response } from 'express';
import { PlatformService } from '../services/platformService';
import { ProjectService } from '../services/projectService';
import { CreatePlatformRequest, ApiResponse } from '../types';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Platforms
 *   description: Platform management endpoints
 */

/**
 * @swagger
 * /api/platforms:
 *   get:
 *     summary: Get all platforms
 *     tags: [Platforms]
 *     responses:
 *       200:
 *         description: List of all platforms
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const platforms = await PlatformService.getAllPlatforms();
    const response: ApiResponse = {
      success: true,
      data: platforms
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

// GET /api/platforms/:id - Get platform by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const platform = await PlatformService.getPlatformById(req.params.id);
    if (!platform) {
      const response: ApiResponse = {
        success: false,
        error: 'Platform not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: platform
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

/**
 * @swagger
 * /api/platforms:
 *   post:
 *     summary: Create a new platform
 *     tags: [Platforms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePlatformRequest'
 *           example:
 *             name: "my-platform"
 *             description: "My development platform"
 *             githubUser: "myuser"
 *     responses:
 *       201:
 *         description: Platform created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Bad request
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const request: CreatePlatformRequest = req.body;

    if (!request.name || !request.githubUser) {
      const response: ApiResponse = {
        success: false,
        error: 'Name and githubUser are required'
      };
      return res.status(400).json(response);
    }

    const platform = await PlatformService.createPlatform(request);
    const response: ApiResponse = {
      success: true,
      data: platform,
      message: 'Platform created successfully'
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

// PUT /api/platforms/:id - Update platform
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const platform = await PlatformService.updatePlatform(req.params.id, req.body);
    if (!platform) {
      const response: ApiResponse = {
        success: false,
        error: 'Platform not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: platform,
      message: 'Platform updated successfully'
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

// DELETE /api/platforms/:id - Delete platform
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await PlatformService.deletePlatform(req.params.id);
    if (!deleted) {
      const response: ApiResponse = {
        success: false,
        error: 'Platform not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Platform deleted successfully'
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

// GET /api/platforms/:id/projects - Get platform projects
router.get('/:id/projects', async (req: Request, res: Response) => {
  try {
    const projects = await ProjectService.getProjectsByPlatform(req.params.id);
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

export default router;