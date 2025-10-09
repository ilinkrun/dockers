import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

import platformRoutes from './routes/platforms';
import projectRoutes from './routes/projects';
import scriptRoutes from './routes/scripts';
import gituserRoutes from './routes/gitusers';
import databaseRoutes from './routes/databases';
import serverRoutes from './routes/servers';
import { FileStorage } from './utils/fileStorage';
import { specs, swaggerUi } from './swagger/config';

// Load root .env file
dotenv.config({ path: path.join(__dirname, '../../..', '.env') });

const app = express();
const PORT = process.env.MANAGER_API_PORT || 20101;

// Middleware - Completely disable helmet for HTTP development
if (process.env.NODE_ENV === 'production') {
  app.use(helmet());
} else {
  // Development mode: disable all security headers that cause issues with HTTP
  console.log('🔓 Development mode: Security headers disabled');
}
app.use(cors({
  origin: [
    'http://localhost:20100',
    'http://1.231.118.217:20100',
    'http://1.231.118.217:20101'
  ],
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging and cache control
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);

  // Disable caching for development
  if (process.env.NODE_ENV !== 'production') {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
  }

  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Swagger documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Platform Manager API Documentation',
  swaggerOptions: {
    url: '/swagger.json',
    supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
    docExpansion: 'list',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true
  }
}));

// Debug endpoint to check swagger spec
app.get('/swagger.json', (req, res) => {
  res.json(specs);
});


// API Routes
app.use('/api/platforms', platformRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/scripts', scriptRoutes);
app.use('/api/gitusers', gituserRoutes);
app.use('/api/databases', databaseRoutes);
app.use('/api/servers', serverRoutes);

// Serve static files for web UI (if built)
const webUIPath = path.join(__dirname, '../web/dist');
app.use(express.static(webUIPath));

// Catch-all handler for SPA routing
app.get('*', (req, res) => {
  const indexPath = path.join(webUIPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).json({
        success: false,
        error: 'Web UI not found. Please build the web application first.'
      });
    }
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Initialize storage and start server
async function startServer() {
  try {
    // Ensure data directory exists
    await FileStorage.ensureDataDirectory();

    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Platform Manager API Server started on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🌍 External access: http://1.231.118.217:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();