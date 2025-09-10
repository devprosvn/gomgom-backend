import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { DatabaseHelpers } from './database';
import { config } from './config';
import { blockchainService } from './services/blockchain';
import { swaggerSpec } from './swagger/config';
import apiRoutes from './routes';

// Load environment variables from root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = config.port;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : ['http://localhost:3001'], // Only allow Next.js dev server
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Swagger documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'GomGom API Documentation'
}));

// API routes
app.use('/api', apiRoutes);

// Health check endpoints
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * @swagger
 * /api/health/database:
 *   get:
 *     summary: Database health check
 *     description: Checks the database connection status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Database is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: 'healthy'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 connection:
 *                   type: boolean
 *       500:
 *         description: Database is unhealthy
 */
app.get('/api/health/database', async (req: Request, res: Response) => {
  try {
    const healthCheck = await DatabaseHelpers.healthCheck();
    res.json(healthCheck);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/health/blockchain:
 *   get:
 *     summary: Blockchain connectivity health check
 *     description: Checks the blockchain connection and contract accessibility
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Blockchain is accessible
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: 'healthy'
 *                 blockNumber:
 *                   type: number
 *                 signerAddress:
 *                   type: string
 *                 signerBalance:
 *                   type: string
 *                 contractsAccessible:
 *                   type: boolean
 *       500:
 *         description: Blockchain is not accessible
 */
app.get('/api/health/blockchain', async (req: Request, res: Response) => {
  try {
    const healthCheck = await blockchainService.healthCheck();
    res.json(healthCheck);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'GomGom Loyalty System Backend API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/api/health'
  });
});

// Error handling middleware
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 GomGom Backend Server is running!`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`\n🔗 Blockchain Configuration:`);
  console.log(`   RPC: ${config.blockchain.rpcUrl}`);
  console.log(`   Registry: ${config.blockchain.contracts.registry}`);
  console.log(`   NFT: ${config.blockchain.contracts.nft}`);
  console.log(`   Staking: ${config.blockchain.contracts.staking}`);
  console.log(`\n⚡ Ready to serve requests!\n`);
});