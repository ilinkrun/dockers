#!/usr/bin/env node

/**
 * Update repositories.json with platform/project repository information
 *
 * Usage:
 *   node update-repositories.js <action> <name> <scope> <user> <description> <local-path>
 *
 * Actions:
 *   add-github    - Add GitHub repository
 *   add-nogit     - Add non-git repository
 *   remove        - Remove repository
 *
 * Example:
 *   node update-repositories.js add-github ubuntu-ilmac platform ilinkrun "Platform description" platforms/ubuntu-ilmac
 */

const fs = require('fs');
const path = require('path');

// Get repositories.json path
const MANAGER_DATA_DIR = path.join(__dirname, '..', 'data');
const REPOSITORIES_JSON = path.join(MANAGER_DATA_DIR, 'repositories.json');

/**
 * Read repositories.json
 */
function readRepositories() {
  try {
    if (!fs.existsSync(REPOSITORIES_JSON)) {
      return {
        github: {},
        nogit: {}
      };
    }
    const data = fs.readFileSync(REPOSITORIES_JSON, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading repositories.json:', error.message);
    process.exit(1);
  }
}

/**
 * Write repositories.json
 */
function writeRepositories(data) {
  try {
    fs.writeFileSync(REPOSITORIES_JSON, JSON.stringify(data, null, 2));
    console.log('✓ Updated repositories.json');
  } catch (error) {
    console.error('Error writing repositories.json:', error.message);
    process.exit(1);
  }
}

/**
 * Add GitHub repository
 */
function addGithubRepository(name, scope, user, description, localPath) {
  const repositories = readRepositories();

  repositories.github[name] = {
    name: name,
    scope: scope,
    user: user,
    path: {
      remote: `https://github.com/${user}/${name}`,
      local: localPath
    },
    description: description,
    temp: false
  };

  writeRepositories(repositories);
  console.log(`✓ Added GitHub repository: ${name}`);
}

/**
 * Add non-git repository
 */
function addNogitRepository(name, scope, description, localPath) {
  const repositories = readRepositories();

  repositories.nogit[name] = {
    name: name,
    scope: scope,
    path: localPath,
    description: description
  };

  writeRepositories(repositories);
  console.log(`✓ Added non-git repository: ${name}`);
}

/**
 * Remove repository
 */
function removeRepository(name) {
  const repositories = readRepositories();
  let removed = false;

  if (repositories.github[name]) {
    delete repositories.github[name];
    removed = true;
  }

  if (repositories.nogit[name]) {
    delete repositories.nogit[name];
    removed = true;
  }

  if (removed) {
    writeRepositories(repositories);
    console.log(`✓ Removed repository: ${name}`);
  } else {
    console.log(`Repository not found: ${name}`);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: node update-repositories.js <action> <name> [<scope> <user> <description> <local-path>]');
  console.error('');
  console.error('Actions:');
  console.error('  add-github <name> <scope> <user> <description> <local-path>');
  console.error('  add-nogit <name> <scope> <description> <local-path>');
  console.error('  remove <name>');
  process.exit(1);
}

const action = args[0];
const name = args[1];

switch (action) {
  case 'add-github':
    if (args.length < 6) {
      console.error('Error: add-github requires: <name> <scope> <user> <description> <local-path>');
      process.exit(1);
    }
    addGithubRepository(name, args[2], args[3], args[4], args[5]);
    break;

  case 'add-nogit':
    if (args.length < 5) {
      console.error('Error: add-nogit requires: <name> <scope> <description> <local-path>');
      process.exit(1);
    }
    addNogitRepository(name, args[2], args[3], args[4]);
    break;

  case 'remove':
    removeRepository(name);
    break;

  default:
    console.error(`Unknown action: ${action}`);
    process.exit(1);
}
