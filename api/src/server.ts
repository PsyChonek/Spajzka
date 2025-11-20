import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import { connectToDatabase, closeDatabaseConnection } from './config/database';
import { swaggerSpec } from './config/swagger';
import healthRouter from './routes/health';
import itemsRouter from './routes/items';
import authRouter from './routes/auth';
import pantryRouter from './routes/pantry';
import shoppingRouter from './routes/shopping';
import groupsRouter from './routes/groups';
import recipesRouter from './routes/recipes';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// JSON endpoint for OpenAPI spec (useful for client generation)
app.get('/api-docs-json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Routes
app.use('/', healthRouter);
app.use('/api', itemsRouter);
app.use('/api', authRouter);
app.use('/api', pantryRouter);
app.use('/api', shoppingRouter);
app.use('/api', groupsRouter);
app.use('/api', recipesRouter);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Spajzka API',
    version: '1.0.0',
    documentation: '/api-docs',
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    message: 'Route not found',
    code: 'NOT_FOUND',
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
});

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectToDatabase();

    // Start listening
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
      console.log(`OpenAPI JSON available at http://localhost:${PORT}/api-docs-json`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await closeDatabaseConnection();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await closeDatabaseConnection();
  process.exit(0);
});

startServer();
