import express from "express";
import { exec } from "child_process";
import { promisify } from "util";

const router = express.Router();
const execAsync = promisify(exec);

/**
 * @swagger
 * /api/scripts/create-platform:
 *   post:
 *     summary: Execute cu.sh to create platform
 *     tags: [Scripts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - githubUser
 *             properties:
 *               name:
 *                 type: string
 *               githubUser:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Script executed successfully
 */
router.post("/create-platform", async (req, res) => {
  try {
    const { name, githubUser, description } = req.body;

    if (!name || !githubUser) {
      return res.status(400).json({
        success: false,
        error: "Name and githubUser are required",
      });
    }

    // Build command
    const descArg = description
      ? `-d "${description.replace(/"/g, '\\"')}"`
      : "";
    const command = `cd /var/services/homes/jungsam/dockers && ./cu.sh -n ${name} -u ${githubUser} ${descArg}`;

    console.log("Executing command:", command);

    // Execute script
    const { stdout, stderr } = await execAsync(command, {
      timeout: 60000, // 60 seconds timeout
      maxBuffer: 1024 * 1024, // 1MB buffer
    });

    res.json({
      success: true,
      data: {
        stdout,
        stderr,
        message: `Platform ${name} created successfully`,
      },
    });
  } catch (error: unknown) {
    console.error("Script execution error:", error);
    const err = error as { message?: string; stdout?: string; stderr?: string };
    res.status(500).json({
      success: false,
      error: err.message || "Failed to execute script",
      details: {
        stdout: err.stdout,
        stderr: err.stderr,
      },
    });
  }
});

/**
 * @swagger
 * /api/scripts/create-project:
 *   post:
 *     summary: Execute cp.sh to create project
 *     tags: [Scripts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - platformId
 *               - name
 *               - githubUser
 *             properties:
 *               platformId:
 *                 type: string
 *               name:
 *                 type: string
 *               githubUser:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Script executed successfully
 */
router.post("/create-project", async (req, res) => {
  try {
    const { platformId, name, githubUser, description } = req.body;

    if (!platformId || !name || !githubUser) {
      return res.status(400).json({
        success: false,
        error: "platformId, name, and githubUser are required",
      });
    }

    // Build command
    const descArg = description
      ? `-d "${description.replace(/"/g, '\\"')}"`
      : "";
    const command = `cd /var/services/homes/jungsam/dockers/${platformId}/projects && ./cp.sh -n ${name} -u ${githubUser} ${descArg}`;

    console.log("Executing command:", command);

    // Execute script with PLATFORM_NAME environment variable
    const { stdout, stderr } = await execAsync(command, {
      timeout: 120000, // 2 minutes
      maxBuffer: 1024 * 1024,
      env: {
        ...process.env,
        PLATFORM_NAME: platformId,
      },
    });

    res.json({
      success: true,
      data: {
        stdout,
        stderr,
        message: `Project ${name} created successfully`,
      },
    });
  } catch (error: unknown) {
    console.error("Script execution error:", error);
    const err = error as { message?: string; stdout?: string; stderr?: string };
    res.status(500).json({
      success: false,
      error: err.message || "Failed to execute script",
      details: {
        stdout: err.stdout,
        stderr: err.stderr,
      },
    });
  }
});

/**
 * @swagger
 * /api/scripts/delete-platform:
 *   post:
 *     summary: Execute xgit to delete platform repositories
 *     tags: [Scripts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - githubUser
 *             properties:
 *               name:
 *                 type: string
 *               githubUser:
 *                 type: string
 *     responses:
 *       200:
 *         description: Script executed successfully
 */
router.post("/delete-platform", async (req, res) => {
  try {
    const { name, githubUser } = req.body;

    if (!name || !githubUser) {
      return res.status(400).json({
        success: false,
        error: "Name and githubUser are required",
      });
    }

    // Build command - execute from platforms directory
    const command = `cd /var/services/homes/jungsam/dockers && xgit -e remove -n ${name} -u ${githubUser}`;

    console.log("Executing command:", command);

    try {
      // Execute script
      const { stdout, stderr } = await execAsync(command, {
        timeout: 120000, // 120 seconds timeout for git operations
        maxBuffer: 1024 * 1024, // 1MB buffer
      });

      res.json({
        success: true,
        data: {
          stdout,
          stderr,
          message: `Platform ${name} repositories deleted successfully`,
        },
      });
    } catch (execError: unknown) {
      // If xgit fails (e.g., repo doesn't exist), log it but continue
      const err = execError as {
        message?: string;
        stdout?: string;
        stderr?: string;
      };
      console.warn("xgit delete warning:", err.message);

      // Check if it's a "Not Found" error
      if (err.stderr && err.stderr.includes("Not Found")) {
        res.json({
          success: true,
          data: {
            stdout: err.stdout || "",
            stderr: err.stderr || "",
            message: `Platform ${name} repository not found (already deleted or never created)`,
          },
        });
      } else {
        throw execError;
      }
    }
  } catch (error: unknown) {
    console.error("Script execution error:", error);
    const err = error as { message?: string; stdout?: string; stderr?: string };
    res.status(500).json({
      success: false,
      error: err.message || "Failed to execute script",
      details: {
        stdout: err.stdout,
        stderr: err.stderr,
      },
    });
  }
});

/**
 * @swagger
 * /api/scripts/delete-project:
 *   post:
 *     summary: Execute xgit to delete project repositories
 *     tags: [Scripts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - platformId
 *               - name
 *               - githubUser
 *             properties:
 *               platformId:
 *                 type: string
 *               name:
 *                 type: string
 *               githubUser:
 *                 type: string
 *     responses:
 *       200:
 *         description: Script executed successfully
 */
router.post("/delete-project", async (req, res) => {
  try {
    const { platformId, name, githubUser } = req.body;

    if (!platformId || !name || !githubUser) {
      return res.status(400).json({
        success: false,
        error: "platformId, name, and githubUser are required",
      });
    }

    // Build command - execute from platform's projects directory
    const command = `cd /var/services/homes/jungsam/dockers/${platformId}/projects && xgit -e remove -n ${name} -u ${githubUser}`;

    console.log("Executing command:", command);

    try {
      // Execute script
      const { stdout, stderr } = await execAsync(command, {
        timeout: 120000,
        maxBuffer: 1024 * 1024,
      });

      res.json({
        success: true,
        data: {
          stdout,
          stderr,
          message: `Project ${name} repositories deleted successfully`,
        },
      });
    } catch (execError: unknown) {
      // If xgit fails (e.g., repo doesn't exist), log it but continue
      const err = execError as {
        message?: string;
        stdout?: string;
        stderr?: string;
      };
      console.warn("xgit delete warning:", err.message);

      // Check if it's a "Not Found" error
      if (err.stderr && err.stderr.includes("Not Found")) {
        res.json({
          success: true,
          data: {
            stdout: err.stdout || "",
            stderr: err.stderr || "",
            message: `Project ${name} repository not found (already deleted or never created)`,
          },
        });
      } else {
        throw execError;
      }
    }
  } catch (error: unknown) {
    console.error("Script execution error:", error);
    const err = error as { message?: string; stdout?: string; stderr?: string };
    res.status(500).json({
      success: false,
      error: err.message || "Failed to execute script",
      details: {
        stdout: err.stdout,
        stderr: err.stderr,
      },
    });
  }
});

export default router;
