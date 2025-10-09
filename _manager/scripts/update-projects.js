#!/usr/bin/env node

/**
 * Update projects.json with project information
 *
 * Usage:
 *   node update-projects.js <projects-file> <project-name> <platform-id> <description> <github-user> <status> <timestamp> <project-sn>
 */

const fs = require('fs');

const [
  projectsFile,
  projectName,
  platformId,
  description,
  githubUser,
  status,
  timestamp,
  projectSn,
] = process.argv.slice(2);

if (!projectsFile || !projectName || !platformId) {
  console.error('Usage: node update-projects.js <projects-file> <project-name> <platform-id> <description> <github-user> <status> <timestamp> <project-sn>');
  process.exit(1);
}

let data = {
  metadata: {
    version: '1.0.0',
    lastUpdated: timestamp || new Date().toISOString(),
    totalProjects: 0,
  },
  projects: {},
};

if (fs.existsSync(projectsFile)) {
  try {
    data = JSON.parse(fs.readFileSync(projectsFile, 'utf-8'));
  } catch (error) {
    console.error('Failed to parse projects.json:', error.message);
    process.exit(1);
  }
}

if (!data.metadata) {
  data.metadata = {
    version: '1.0.0',
    lastUpdated: timestamp || new Date().toISOString(),
    totalProjects: 0,
  };
}

if (!data.projects) {
  data.projects = {};
}

const snValue = Number(projectSn);

data.projects[projectName] = {
  id: projectName,
  sn: Number.isNaN(snValue) ? 0 : snValue,
  name: projectName,
  platformId,
  description: description || projectName,
  githubUser: githubUser || '',
  createdAt: timestamp || new Date().toISOString(),
  updatedAt: timestamp || new Date().toISOString(),
  status: status || 'development',
};

data.metadata.lastUpdated = timestamp || new Date().toISOString();
data.metadata.totalProjects = Object.keys(data.projects).length;

try {
  fs.writeFileSync(projectsFile, JSON.stringify(data, null, 2));
  console.log('✓ Updated projects.json');
} catch (error) {
  console.error('Failed to write projects.json:', error.message);
  process.exit(1);
}
