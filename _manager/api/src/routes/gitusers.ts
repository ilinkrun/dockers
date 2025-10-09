import express from "express";
import * as fs from "fs/promises";
import * as path from "path";

const router = express.Router();

interface GitUser {
  fullName: string;
  email: string;
  token: string;
  token2?: string;
  expired?: string;
}

interface GitUsersData {
  [key: string]: GitUser;
}

const GITUSERS_PATH =
  "/var/services/homes/jungsam/dockers/_manager/data/gitusers.json";

/**
 * @swagger
 * /api/gitusers:
 *   get:
 *     summary: Get all GitHub users
 *     tags: [GitUsers]
 *     responses:
 *       200:
 *         description: List of GitHub users
 */
router.get("/", async (req, res) => {
  try {
    const data = await fs.readFile(GITUSERS_PATH, "utf-8");
    const gitusers: GitUsersData = JSON.parse(data);

    // Check if detail query param is provided
    const detail = req.query.detail === "true";

    if (detail) {
      // Return full data with username as key
      const users = Object.entries(gitusers).map(([username, user]) => ({
        username,
        ...user,
      }));
      res.json({
        success: true,
        data: users,
      });
    } else {
      // Return only usernames (keys) for dropdown
      const usernames = Object.keys(gitusers);
      res.json({
        success: true,
        data: usernames,
      });
    }
  } catch (error) {
    console.error("Failed to read gitusers:", error);
    res.status(500).json({
      success: false,
      error: "Failed to read GitHub users",
    });
  }
});

/**
 * @swagger
 * /api/gitusers/{username}:
 *   get:
 *     summary: Get a specific GitHub user
 *     tags: [GitUsers]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: GitHub user details
 */
router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const data = await fs.readFile(GITUSERS_PATH, "utf-8");
    const gitusers: GitUsersData = JSON.parse(data);

    if (!gitusers[username]) {
      return res.status(404).json({
        success: false,
        error: "GitHub user not found",
      });
    }

    res.json({
      success: true,
      data: {
        username,
        ...gitusers[username],
      },
    });
  } catch (error) {
    console.error("Failed to read gituser:", error);
    res.status(500).json({
      success: false,
      error: "Failed to read GitHub user",
    });
  }
});

/**
 * @swagger
 * /api/gitusers:
 *   post:
 *     summary: Create a new GitHub user
 *     tags: [GitUsers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - fullName
 *               - email
 *               - token
 *             properties:
 *               username:
 *                 type: string
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               token:
 *                 type: string
 *               token2:
 *                 type: string
 *               expired:
 *                 type: string
 *     responses:
 *       201:
 *         description: GitHub user created successfully
 */
router.post("/", async (req, res) => {
  try {
    const { username, fullName, email, token, token2, expired } = req.body;

    // Validation
    if (!username || !fullName || !email || !token) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: username, fullName, email, token",
      });
    }

    // Read existing data
    const data = await fs.readFile(GITUSERS_PATH, "utf-8");
    const gitusers: GitUsersData = JSON.parse(data);

    // Check if username already exists
    if (gitusers[username]) {
      return res.status(409).json({
        success: false,
        error: "GitHub user with this username already exists",
      });
    }

    // Create new user
    const newUser: GitUser = {
      fullName,
      email,
      token,
      ...(token2 && { token2 }),
      ...(expired && { expired }),
    };

    gitusers[username] = newUser;

    // Write back to file
    await fs.writeFile(GITUSERS_PATH, JSON.stringify(gitusers, null, 2));

    res.status(201).json({
      success: true,
      data: {
        username,
        ...newUser,
      },
    });
  } catch (error) {
    console.error("Failed to create gituser:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create GitHub user",
    });
  }
});

/**
 * @swagger
 * /api/gitusers/{username}:
 *   put:
 *     summary: Update a GitHub user
 *     tags: [GitUsers]
 *     parameters:
 *       - in: path
 *         name: username
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
 *         description: GitHub user updated successfully
 */
router.put("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const { fullName, email, token, token2, expired } = req.body;

    // Read existing data
    const data = await fs.readFile(GITUSERS_PATH, "utf-8");
    const gitusers: GitUsersData = JSON.parse(data);

    if (!gitusers[username]) {
      return res.status(404).json({
        success: false,
        error: "GitHub user not found",
      });
    }

    // Update user
    gitusers[username] = {
      ...gitusers[username],
      ...(fullName && { fullName }),
      ...(email && { email }),
      ...(token && { token }),
      ...(token2 !== undefined && { token2 }),
      ...(expired !== undefined && { expired }),
    };

    // Remove token2 and expired if they are explicitly set to empty string
    if (token2 === "") delete gitusers[username].token2;
    if (expired === "") delete gitusers[username].expired;

    // Write back to file
    await fs.writeFile(GITUSERS_PATH, JSON.stringify(gitusers, null, 2));

    res.json({
      success: true,
      data: {
        username,
        ...gitusers[username],
      },
    });
  } catch (error) {
    console.error("Failed to update gituser:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update GitHub user",
    });
  }
});

/**
 * @swagger
 * /api/gitusers/{username}:
 *   delete:
 *     summary: Delete a GitHub user
 *     tags: [GitUsers]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: GitHub user deleted successfully
 */
router.delete("/:username", async (req, res) => {
  try {
    const { username } = req.params;

    // Read existing data
    const data = await fs.readFile(GITUSERS_PATH, "utf-8");
    const gitusers: GitUsersData = JSON.parse(data);

    if (!gitusers[username]) {
      return res.status(404).json({
        success: false,
        error: "GitHub user not found",
      });
    }

    // Delete user
    delete gitusers[username];

    // Write back to file
    await fs.writeFile(GITUSERS_PATH, JSON.stringify(gitusers, null, 2));

    res.json({
      success: true,
      message: "GitHub user deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete gituser:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete GitHub user",
    });
  }
});

export default router;
