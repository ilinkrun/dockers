import express from "express";
import * as fs from "fs/promises";

const router = express.Router();

interface ServerTemplate {
  id: string;
  name: string;
  type: "backend" | "graphql" | "frontend";
  framework: string;
  language: string;
  description: string;
  features: string[];
}

interface ServersData {
  metadata: {
    version: string;
    lastUpdated: string;
    description: string;
  };
  templates: {
    backend: { [key: string]: ServerTemplate };
    graphql: { [key: string]: ServerTemplate };
    frontend: { [key: string]: ServerTemplate };
  };
  projectServers: {
    [projectId: string]: {
      projectId: string;
      platformId: string;
      servers: any[];
    };
  };
}

const SERVERS_PATH =
  "/var/services/homes/jungsam/dockers/_manager/data/servers.json";

/**
 * @swagger
 * /api/servers/templates:
 *   get:
 *     summary: Get all server templates
 *     tags: [Servers]
 *     responses:
 *       200:
 *         description: List of server templates
 */
router.get("/templates", async (req, res) => {
  try {
    const data = await fs.readFile(SERVERS_PATH, "utf-8");
    const servers: ServersData = JSON.parse(data);

    // Flatten templates into a single array
    const allTemplates = [
      ...Object.values(servers.templates.backend),
      ...Object.values(servers.templates.graphql),
      ...Object.values(servers.templates.frontend),
    ];

    res.json({
      success: true,
      data: {
        backend: Object.values(servers.templates.backend),
        graphql: Object.values(servers.templates.graphql),
        frontend: Object.values(servers.templates.frontend),
        all: allTemplates,
      },
    });
  } catch (error) {
    console.error("Failed to read server templates:", error);
    res.status(500).json({
      success: false,
      error: "Failed to read server templates",
    });
  }
});

/**
 * @swagger
 * /api/servers/templates/{type}:
 *   get:
 *     summary: Get templates by type
 *     tags: [Servers]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [backend, graphql, frontend]
 *     responses:
 *       200:
 *         description: List of templates for the specified type
 */
router.get("/templates/:type", async (req, res) => {
  try {
    const { type } = req.params;

    if (!["backend", "graphql", "frontend"].includes(type)) {
      return res.status(400).json({
        success: false,
        error: "Invalid server type. Must be backend, graphql, or frontend",
      });
    }

    const data = await fs.readFile(SERVERS_PATH, "utf-8");
    const servers: ServersData = JSON.parse(data);

    res.json({
      success: true,
      data: Object.values(
        servers.templates[type as keyof ServersData["templates"]]
      ),
    });
  } catch (error) {
    console.error("Failed to read server templates:", error);
    res.status(500).json({
      success: false,
      error: "Failed to read server templates",
    });
  }
});

/**
 * @swagger
 * /api/servers/templates:
 *   post:
 *     summary: Create a new server template
 *     tags: [Servers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - name
 *               - type
 *               - framework
 *               - language
 *               - description
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [backend, graphql, frontend]
 *               framework:
 *                 type: string
 *               language:
 *                 type: string
 *               description:
 *                 type: string
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Server template created successfully
 */
router.post("/templates", async (req, res) => {
  try {
    const {
      id,
      name,
      type,
      framework,
      language,
      description,
      features = [],
    } = req.body;

    // Validation
    if (!id || !name || !type || !framework || !language || !description) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    if (!["backend", "graphql", "frontend"].includes(type)) {
      return res.status(400).json({
        success: false,
        error: "Invalid type. Must be backend, graphql, or frontend",
      });
    }

    // Read existing data
    const data = await fs.readFile(SERVERS_PATH, "utf-8");
    const servers: ServersData = JSON.parse(data);

    // Check if template ID already exists
    if (servers.templates[type as keyof ServersData["templates"]][id]) {
      return res.status(409).json({
        success: false,
        error: "Server template with this ID already exists",
      });
    }

    // Create new template
    const newTemplate: ServerTemplate = {
      id,
      name,
      type,
      framework,
      language,
      description,
      features: Array.isArray(features) ? features : [],
    };

    servers.templates[type as keyof ServersData["templates"]][id] = newTemplate;

    // Update metadata
    servers.metadata.lastUpdated = new Date().toISOString();

    // Write back to file
    await fs.writeFile(SERVERS_PATH, JSON.stringify(servers, null, 2));

    res.status(201).json({
      success: true,
      data: newTemplate,
    });
  } catch (error) {
    console.error("Failed to create server template:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create server template",
    });
  }
});

/**
 * @swagger
 * /api/servers/templates/{type}/{id}:
 *   put:
 *     summary: Update a server template
 *     tags: [Servers]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [backend, graphql, frontend]
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Server template updated successfully
 */
router.put("/templates/:type/:id", async (req, res) => {
  try {
    const { type, id } = req.params;
    const { name, framework, language, description, features } = req.body;

    if (!["backend", "graphql", "frontend"].includes(type)) {
      return res.status(400).json({
        success: false,
        error: "Invalid type",
      });
    }

    // Read existing data
    const data = await fs.readFile(SERVERS_PATH, "utf-8");
    const servers: ServersData = JSON.parse(data);

    const typeSection =
      servers.templates[type as keyof ServersData["templates"]];

    if (!typeSection[id]) {
      return res.status(404).json({
        success: false,
        error: "Server template not found",
      });
    }

    // Update template
    const updatedTemplate: ServerTemplate = {
      ...typeSection[id],
      ...(name && { name }),
      ...(framework && { framework }),
      ...(language && { language }),
      ...(description && { description }),
      ...(features && { features }),
    };

    typeSection[id] = updatedTemplate;

    // Update metadata
    servers.metadata.lastUpdated = new Date().toISOString();

    // Write back to file
    await fs.writeFile(SERVERS_PATH, JSON.stringify(servers, null, 2));

    res.json({
      success: true,
      data: updatedTemplate,
    });
  } catch (error) {
    console.error("Failed to update server template:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update server template",
    });
  }
});

/**
 * @swagger
 * /api/servers/templates/{type}/{id}:
 *   delete:
 *     summary: Delete a server template
 *     tags: [Servers]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [backend, graphql, frontend]
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Server template deleted successfully
 */
router.delete("/templates/:type/:id", async (req, res) => {
  try {
    const { type, id } = req.params;

    if (!["backend", "graphql", "frontend"].includes(type)) {
      return res.status(400).json({
        success: false,
        error: "Invalid type",
      });
    }

    // Read existing data
    const data = await fs.readFile(SERVERS_PATH, "utf-8");
    const servers: ServersData = JSON.parse(data);

    const typeSection =
      servers.templates[type as keyof ServersData["templates"]];

    if (!typeSection[id]) {
      return res.status(404).json({
        success: false,
        error: "Server template not found",
      });
    }

    // Delete template
    delete typeSection[id];

    // Update metadata
    servers.metadata.lastUpdated = new Date().toISOString();

    // Write back to file
    await fs.writeFile(SERVERS_PATH, JSON.stringify(servers, null, 2));

    res.json({
      success: true,
      message: "Server template deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete server template:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete server template",
    });
  }
});

/**
 * @swagger
 * /api/servers/project-servers:
 *   get:
 *     summary: Get all project servers
 *     tags: [Servers]
 *     responses:
 *       200:
 *         description: List of all project servers
 */
router.get("/project-servers", async (req, res) => {
  try {
    const data = await fs.readFile(SERVERS_PATH, "utf-8");
    const servers: ServersData = JSON.parse(data);

    // Convert to array format with project info
    const allServers = Object.entries(servers.projectServers).flatMap(
      ([projectId, projectServer]) =>
        projectServer.servers.map((server) => ({
          ...server,
          projectId: projectServer.projectId,
          platformId: projectServer.platformId,
        }))
    );

    res.json({
      success: true,
      data: allServers,
    });
  } catch (error) {
    console.error("Failed to read project servers:", error);
    res.status(500).json({
      success: false,
      error: "Failed to read project servers",
    });
  }
});

/**
 * @swagger
 * /api/servers/project-servers/{projectId}:
 *   get:
 *     summary: Get servers for a specific project
 *     tags: [Servers]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of servers for the project
 */
router.get("/project-servers/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const data = await fs.readFile(SERVERS_PATH, "utf-8");
    const servers: ServersData = JSON.parse(data);

    if (!servers.projectServers[projectId]) {
      return res.status(404).json({
        success: false,
        error: "Project servers not found",
      });
    }

    res.json({
      success: true,
      data: servers.projectServers[projectId],
    });
  } catch (error) {
    console.error("Failed to read project servers:", error);
    res.status(500).json({
      success: false,
      error: "Failed to read project servers",
    });
  }
});

/**
 * @swagger
 * /api/servers/project-servers:
 *   post:
 *     summary: Add a server to a project
 *     tags: [Servers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - platformId
 *               - type
 *               - templateId
 *               - port
 *             properties:
 *               projectId:
 *                 type: string
 *               platformId:
 *                 type: string
 *               type:
 *                 type: string
 *               templateId:
 *                 type: string
 *               port:
 *                 type: number
 *               enabled:
 *                 type: boolean
 *               config:
 *                 type: object
 *     responses:
 *       201:
 *         description: Server added successfully
 */
router.post("/project-servers", async (req, res) => {
  try {
    const {
      projectId,
      platformId,
      type,
      templateId,
      port,
      enabled = true,
      config = {},
    } = req.body;

    // Validation
    if (!projectId || !platformId || !type || !templateId || !port) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Read existing data
    const data = await fs.readFile(SERVERS_PATH, "utf-8");
    const servers: ServersData = JSON.parse(data);

    // Check for port duplication across all servers
    const allPorts = Object.values(servers.projectServers).flatMap((ps) =>
      ps.servers.map((s) => s.port)
    );

    if (allPorts.includes(port)) {
      return res.status(409).json({
        success: false,
        error: `Port ${port} is already in use by another server`,
      });
    }

    // Initialize project servers if not exists
    if (!servers.projectServers[projectId]) {
      servers.projectServers[projectId] = {
        projectId,
        platformId,
        servers: [],
      };
    }

    // Generate server ID
    const serverId = `${type}_${projectId}`;

    // Check if server with same ID already exists
    const existingServer = servers.projectServers[projectId].servers.find(
      (s) => s.id === serverId
    );
    if (existingServer) {
      return res.status(409).json({
        success: false,
        error: `Server with type ${type} already exists for this project`,
      });
    }

    // Create new server
    const newServer = {
      id: serverId,
      projectId,
      platformId,
      type,
      templateId,
      port,
      enabled,
      config,
    };

    servers.projectServers[projectId].servers.push(newServer);

    // Update metadata
    servers.metadata.lastUpdated = new Date().toISOString();

    // Write back to file
    await fs.writeFile(SERVERS_PATH, JSON.stringify(servers, null, 2));

    res.status(201).json({
      success: true,
      data: newServer,
    });
  } catch (error) {
    console.error("Failed to create server:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create server",
    });
  }
});

/**
 * @swagger
 * /api/servers/project-servers/{projectId}/{serverId}:
 *   put:
 *     summary: Update a project server
 *     tags: [Servers]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: serverId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Server updated successfully
 */
router.put("/project-servers/:projectId/:serverId", async (req, res) => {
  try {
    const { projectId, serverId } = req.params;
    const { port, enabled, config, templateId } = req.body;

    // Read existing data
    const data = await fs.readFile(SERVERS_PATH, "utf-8");
    const servers: ServersData = JSON.parse(data);

    if (!servers.projectServers[projectId]) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    const serverIndex = servers.projectServers[projectId].servers.findIndex(
      (s) => s.id === serverId
    );
    if (serverIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Server not found",
      });
    }

    const currentServer =
      servers.projectServers[projectId].servers[serverIndex];

    // Check for port duplication if port is being changed
    if (port && port !== currentServer.port) {
      const allPorts = Object.values(servers.projectServers).flatMap((ps) =>
        ps.servers.filter((s) => s.id !== serverId).map((s) => s.port)
      );

      if (allPorts.includes(port)) {
        return res.status(409).json({
          success: false,
          error: `Port ${port} is already in use by another server`,
        });
      }
    }

    // Update server
    const updatedServer = {
      ...currentServer,
      ...(port && { port }),
      ...(enabled !== undefined && { enabled }),
      ...(config && { config }),
      ...(templateId && { templateId }),
    };

    servers.projectServers[projectId].servers[serverIndex] = updatedServer;

    // Update metadata
    servers.metadata.lastUpdated = new Date().toISOString();

    // Write back to file
    await fs.writeFile(SERVERS_PATH, JSON.stringify(servers, null, 2));

    res.json({
      success: true,
      data: updatedServer,
    });
  } catch (error) {
    console.error("Failed to update server:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update server",
    });
  }
});

/**
 * @swagger
 * /api/servers/project-servers/{projectId}/{serverId}:
 *   delete:
 *     summary: Delete a project server
 *     tags: [Servers]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: serverId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Server deleted successfully
 */
router.delete("/project-servers/:projectId/:serverId", async (req, res) => {
  try {
    const { projectId, serverId } = req.params;

    // Read existing data
    const data = await fs.readFile(SERVERS_PATH, "utf-8");
    const servers: ServersData = JSON.parse(data);

    if (!servers.projectServers[projectId]) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    const serverIndex = servers.projectServers[projectId].servers.findIndex(
      (s) => s.id === serverId
    );
    if (serverIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Server not found",
      });
    }

    // Remove server
    servers.projectServers[projectId].servers.splice(serverIndex, 1);

    // Update metadata
    servers.metadata.lastUpdated = new Date().toISOString();

    // Write back to file
    await fs.writeFile(SERVERS_PATH, JSON.stringify(servers, null, 2));

    res.json({
      success: true,
      message: "Server deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete server:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete server",
    });
  }
});

export default router;
