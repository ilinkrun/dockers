import express from "express";
import * as fs from "fs/promises";
import * as path from "path";

const router = express.Router();

interface DatabaseConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  user: string;
  password: string;
  description: string;
}

interface DatabasesData {
  metadata: {
    version: string;
    lastUpdated: string;
  };
  mysqls: {
    [key: string]: DatabaseConfig;
  };
  postgresqls: {
    [key: string]: DatabaseConfig;
  };
}

const DATABASES_PATH =
  "/var/services/homes/jungsam/dockers/_manager/data/databases.json";

/**
 * @swagger
 * /api/databases:
 *   get:
 *     summary: Get all available databases
 *     tags: [Databases]
 *     responses:
 *       200:
 *         description: List of MySQL and PostgreSQL databases
 */
router.get("/", async (req, res) => {
  try {
    const data = await fs.readFile(DATABASES_PATH, "utf-8");
    const databases: DatabasesData = JSON.parse(data);

    res.json({
      success: true,
      data: {
        mysqls: Object.values(databases.mysqls),
        postgresqls: Object.values(databases.postgresqls),
      },
    });
  } catch (error) {
    console.error("Failed to read databases:", error);
    res.status(500).json({
      success: false,
      error: "Failed to read databases configuration",
    });
  }
});

/**
 * @swagger
 * /api/databases/mysql:
 *   get:
 *     summary: Get all MySQL databases
 *     tags: [Databases]
 *     responses:
 *       200:
 *         description: List of MySQL databases
 */
router.get("/mysql", async (req, res) => {
  try {
    const data = await fs.readFile(DATABASES_PATH, "utf-8");
    const databases: DatabasesData = JSON.parse(data);

    res.json({
      success: true,
      data: Object.values(databases.mysqls),
    });
  } catch (error) {
    console.error("Failed to read MySQL databases:", error);
    res.status(500).json({
      success: false,
      error: "Failed to read MySQL databases",
    });
  }
});

/**
 * @swagger
 * /api/databases/postgresql:
 *   get:
 *     summary: Get all PostgreSQL databases
 *     tags: [Databases]
 *     responses:
 *       200:
 *         description: List of PostgreSQL databases
 */
router.get("/postgresql", async (req, res) => {
  try {
    const data = await fs.readFile(DATABASES_PATH, "utf-8");
    const databases: DatabasesData = JSON.parse(data);

    res.json({
      success: true,
      data: Object.values(databases.postgresqls),
    });
  } catch (error) {
    console.error("Failed to read PostgreSQL databases:", error);
    res.status(500).json({
      success: false,
      error: "Failed to read PostgreSQL databases",
    });
  }
});

/**
 * @swagger
 * /api/databases:
 *   post:
 *     summary: Create a new database configuration
 *     tags: [Databases]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - id
 *               - name
 *               - host
 *               - port
 *               - user
 *               - password
 *               - description
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [mysql, postgresql]
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               host:
 *                 type: string
 *               port:
 *                 type: number
 *               user:
 *                 type: string
 *               password:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Database configuration created successfully
 */
router.post("/", async (req, res) => {
  try {
    const { type, id, name, host, port, user, password, description } =
      req.body;

    // Validation
    if (!type || !id || !name || !host || !port || !user || !password) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    if (type !== "mysql" && type !== "postgresql") {
      return res.status(400).json({
        success: false,
        error: 'Invalid database type. Must be "mysql" or "postgresql"',
      });
    }

    // Read existing data
    const data = await fs.readFile(DATABASES_PATH, "utf-8");
    const databases: DatabasesData = JSON.parse(data);

    // Check if ID already exists
    const dbSection =
      type === "mysql" ? databases.mysqls : databases.postgresqls;
    if (dbSection[id]) {
      return res.status(409).json({
        success: false,
        error: "Database configuration with this ID already exists",
      });
    }

    // Create new database config
    const newDb: DatabaseConfig = {
      id,
      name,
      host,
      port: Number(port),
      user,
      password,
      description: description || "",
    };

    // Add to appropriate section
    dbSection[id] = newDb;

    // Update metadata
    databases.metadata.lastUpdated = new Date().toISOString();

    // Write back to file
    await fs.writeFile(DATABASES_PATH, JSON.stringify(databases, null, 2));

    res.status(201).json({
      success: true,
      data: newDb,
    });
  } catch (error) {
    console.error("Failed to create database:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create database configuration",
    });
  }
});

/**
 * @swagger
 * /api/databases/{type}/{id}:
 *   put:
 *     summary: Update a database configuration
 *     tags: [Databases]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [mysql, postgresql]
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
 *         description: Database configuration updated successfully
 */
router.put("/:type/:id", async (req, res) => {
  try {
    const { type, id } = req.params;
    const { name, host, port, user, password, description } = req.body;

    if (type !== "mysql" && type !== "postgresql") {
      return res.status(400).json({
        success: false,
        error: "Invalid database type",
      });
    }

    // Read existing data
    const data = await fs.readFile(DATABASES_PATH, "utf-8");
    const databases: DatabasesData = JSON.parse(data);

    const dbSection =
      type === "mysql" ? databases.mysqls : databases.postgresqls;

    if (!dbSection[id]) {
      return res.status(404).json({
        success: false,
        error: "Database configuration not found",
      });
    }

    // Update fields
    const updatedDb: DatabaseConfig = {
      ...dbSection[id],
      ...(name && { name }),
      ...(host && { host }),
      ...(port && { port: Number(port) }),
      ...(user && { user }),
      ...(password && { password }),
      ...(description !== undefined && { description }),
    };

    dbSection[id] = updatedDb;

    // Update metadata
    databases.metadata.lastUpdated = new Date().toISOString();

    // Write back to file
    await fs.writeFile(DATABASES_PATH, JSON.stringify(databases, null, 2));

    res.json({
      success: true,
      data: updatedDb,
    });
  } catch (error) {
    console.error("Failed to update database:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update database configuration",
    });
  }
});

/**
 * @swagger
 * /api/databases/{type}/{id}:
 *   delete:
 *     summary: Delete a database configuration
 *     tags: [Databases]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [mysql, postgresql]
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Database configuration deleted successfully
 */
router.delete("/:type/:id", async (req, res) => {
  try {
    const { type, id } = req.params;

    if (type !== "mysql" && type !== "postgresql") {
      return res.status(400).json({
        success: false,
        error: "Invalid database type",
      });
    }

    // Read existing data
    const data = await fs.readFile(DATABASES_PATH, "utf-8");
    const databases: DatabasesData = JSON.parse(data);

    const dbSection =
      type === "mysql" ? databases.mysqls : databases.postgresqls;

    if (!dbSection[id]) {
      return res.status(404).json({
        success: false,
        error: "Database configuration not found",
      });
    }

    // Delete the database config
    delete dbSection[id];

    // Update metadata
    databases.metadata.lastUpdated = new Date().toISOString();

    // Write back to file
    await fs.writeFile(DATABASES_PATH, JSON.stringify(databases, null, 2));

    res.json({
      success: true,
      message: "Database configuration deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete database:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete database configuration",
    });
  }
});

export default router;
