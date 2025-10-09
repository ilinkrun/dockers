#!/usr/bin/env node

/**
 * create-project-db.js
 *
 * Creates database and user for a project on MySQL or PostgreSQL
 *
 * Usage:
 *   node create-project-db.js <platform-name> <project-name> <server-type>
 *
 * Example:
 *   node create-project-db.js ubuntu-ilmac my-project mysql
 *   node create-project-db.js ubuntu-ilmac my-project postgresql
 */

const mysql = require('mysql2/promise');
const { Client } = require('pg');

/**
 * Convert string to snake_case
 */
function toSnakeCase(str) {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/[-\s]+/g, '_')
    .replace(/^_/, '');
}

/**
 * Generate database name from platform and project names
 */
function generateDbName(platformName, projectName) {
  const platformSnake = toSnakeCase(platformName);
  const projectSnake = toSnakeCase(projectName);
  return `${platformSnake}__${projectSnake}_db`;
}

/**
 * Generate database user name from project name
 */
function generateDbUser(projectName) {
  const projectSnake = toSnakeCase(projectName);
  return `${projectSnake}_user`;
}

/**
 * Generate random password
 */
function generatePassword(length = 16) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

/**
 * Create MySQL database and user
 */
async function createMysqlDatabase(platformName, projectName, connectSetting) {
  const dbName = generateDbName(platformName, projectName);
  const dbUser = generateDbUser(projectName);
  const dbPassword = generatePassword();

  console.log(`\n🔵 MySQL - Creating database for project...`);
  console.log(`   Platform: ${platformName}`);
  console.log(`   Project: ${projectName}`);
  console.log(`   Database: ${dbName}`);
  console.log(`   User: ${dbUser}`);

  let connection;

  try {
    // Connect to MySQL server
    connection = await mysql.createConnection({
      host: connectSetting.host,
      port: connectSetting.port,
      user: connectSetting.user,
      password: connectSetting.password,
    });

    console.log(`   ✓ Connected to MySQL server at ${connectSetting.host}:${connectSetting.port}`);

    // Check if database already exists
    const [databases] = await connection.query(
      'SHOW DATABASES LIKE ?',
      [dbName]
    );

    if (databases.length > 0) {
      console.log(`   ⚠ Database '${dbName}' already exists`);

      // Check if user exists
      const [users] = await connection.query(
        "SELECT User FROM mysql.user WHERE User = ?",
        [dbUser]
      );

      if (users.length > 0) {
        console.log(`   ⚠ User '${dbUser}' already exists`);
        console.log(`\n   ℹ Database and user already configured.`);
        await connection.end();
        return {
          success: true,
          exists: true,
          dbName,
          dbUser,
          message: 'Database and user already exist'
        };
      }
    }

    // Create database
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`   ✓ Database '${dbName}' created`);

    // Create user
    await connection.query(
      `CREATE USER IF NOT EXISTS ?@'%' IDENTIFIED BY ?`,
      [dbUser, dbPassword]
    );
    console.log(`   ✓ User '${dbUser}' created`);

    // Grant privileges
    await connection.query(
      `GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO ?@'%'`,
      [dbUser]
    );
    console.log(`   ✓ Privileges granted to '${dbUser}' on '${dbName}'`);

    // Flush privileges
    await connection.query('FLUSH PRIVILEGES');
    console.log(`   ✓ Privileges flushed`);

    await connection.end();

    console.log(`\n✅ MySQL database setup completed successfully!`);
    console.log(`\n   Connection Details:`);
    console.log(`   -------------------`);
    console.log(`   DB_HOST=${connectSetting.host}`);
    console.log(`   DB_PORT=${connectSetting.port}`);
    console.log(`   DB_NAME=${dbName}`);
    console.log(`   DB_USER=${dbUser}`);
    console.log(`   DB_PASSWORD=${dbPassword}`);

    return {
      success: true,
      exists: false,
      dbName,
      dbUser,
      dbPassword,
      host: connectSetting.host,
      port: connectSetting.port
    };

  } catch (error) {
    if (connection) {
      await connection.end();
    }
    console.error(`\n❌ MySQL Error:`, error.message);
    throw error;
  }
}

/**
 * Create PostgreSQL database and user
 */
async function createPostgresqlDatabase(platformName, projectName, connectSetting) {
  const dbName = generateDbName(platformName, projectName);
  const dbUser = generateDbUser(projectName);
  const dbPassword = generatePassword();

  console.log(`\n🟣 PostgreSQL - Creating database for project...`);
  console.log(`   Platform: ${platformName}`);
  console.log(`   Project: ${projectName}`);
  console.log(`   Database: ${dbName}`);
  console.log(`   User: ${dbUser}`);

  const client = new Client({
    host: connectSetting.host,
    port: connectSetting.port,
    user: connectSetting.user,
    password: connectSetting.password,
    database: 'postgres', // Connect to default postgres database
  });

  try {
    await client.connect();
    console.log(`   ✓ Connected to PostgreSQL server at ${connectSetting.host}:${connectSetting.port}`);

    // Check if database already exists
    const dbCheckResult = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );

    if (dbCheckResult.rows.length > 0) {
      console.log(`   ⚠ Database '${dbName}' already exists`);

      // Check if user exists
      const userCheckResult = await client.query(
        'SELECT 1 FROM pg_user WHERE usename = $1',
        [dbUser]
      );

      if (userCheckResult.rows.length > 0) {
        console.log(`   ⚠ User '${dbUser}' already exists`);
        console.log(`\n   ℹ Database and user already configured.`);
        await client.end();
        return {
          success: true,
          exists: true,
          dbName,
          dbUser,
          message: 'Database and user already exist'
        };
      }
    }

    // Create user
    await client.query(
      `CREATE USER ${dbUser} WITH PASSWORD '${dbPassword}'`
    );
    console.log(`   ✓ User '${dbUser}' created`);

    // Create database with owner
    await client.query(
      `CREATE DATABASE ${dbName} OWNER ${dbUser} ENCODING 'UTF8'`
    );
    console.log(`   ✓ Database '${dbName}' created`);

    // Grant privileges
    await client.query(
      `GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${dbUser}`
    );
    console.log(`   ✓ Privileges granted to '${dbUser}' on '${dbName}'`);

    await client.end();

    console.log(`\n✅ PostgreSQL database setup completed successfully!`);
    console.log(`\n   Connection Details:`);
    console.log(`   -------------------`);
    console.log(`   DB_HOST=${connectSetting.host}`);
    console.log(`   DB_PORT=${connectSetting.port}`);
    console.log(`   DB_NAME=${dbName}`);
    console.log(`   DB_USER=${dbUser}`);
    console.log(`   DB_PASSWORD=${dbPassword}`);

    return {
      success: true,
      exists: false,
      dbName,
      dbUser,
      dbPassword,
      host: connectSetting.host,
      port: connectSetting.port
    };

  } catch (error) {
    await client.end();
    console.error(`\n❌ PostgreSQL Error:`, error.message);
    throw error;
  }
}

/**
 * Main function to create database
 */
async function createProjectDb(platformName, projectName, connectSetting, server = 'mysql') {
  if (!platformName || !projectName) {
    throw new Error('Platform name and project name are required');
  }

  if (!connectSetting || !connectSetting.host || !connectSetting.user || !connectSetting.password) {
    throw new Error('Invalid connection settings. Required: host, port, user, password');
  }

  server = server.toLowerCase();

  if (server === 'mysql') {
    return await createMysqlDatabase(platformName, projectName, connectSetting);
  } else if (server === 'postgresql' || server === 'postgres' || server === 'pg') {
    return await createPostgresqlDatabase(platformName, projectName, connectSetting);
  } else {
    throw new Error(`Unsupported server type: ${server}. Use 'mysql' or 'postgresql'`);
  }
}

// CLI Usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log(`
Usage: node create-project-db.js <platform-name> <project-name> <server-type>

Arguments:
  platform-name   Platform name (e.g., ubuntu-ilmac)
  project-name    Project name (e.g., my-project)
  server-type     Database server type: 'mysql' or 'postgresql'

Example:
  node create-project-db.js ubuntu-ilmac my-project mysql
  node create-project-db.js ubuntu-ilmac my-project postgresql
`);
    process.exit(1);
  }

  const [platformName, projectName, serverType] = args;

  // For CLI usage, you need to provide connection settings
  // This is a test configuration - in real usage, these should come from .env
  const testConnectSetting = {
    mysql: {
      host: '1.231.118.217',
      port: 2306,
      user: 'root',
      password: 'mysqlIlmac1!'
    },
    postgresql: {
      host: '1.231.118.217',
      port: 5433,
      user: 'admin',
      password: 'IlmacPost9)'
    }
  };

  const server = serverType.toLowerCase();
  const connectSetting = server.includes('postgres') ? testConnectSetting.postgresql : testConnectSetting.mysql;

  createProjectDb(platformName, projectName, connectSetting, server)
    .then((result) => {
      console.log(`\n✅ Operation completed successfully!`);
      if (!result.exists && result.dbPassword) {
        console.log(`\n⚠️  IMPORTANT: Save these credentials!`);
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error(`\n❌ Failed to create database:`, error.message);
      process.exit(1);
    });
}

// Export for use as module
module.exports = {
  createProjectDb,
  generateDbName,
  generateDbUser,
  toSnakeCase
};
