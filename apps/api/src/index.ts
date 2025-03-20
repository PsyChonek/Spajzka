import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import config from "./config/config";
import { RegisterRoutes } from "./routes/routes";

// Express setup
const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

// Connect to MongoDB
mongoose
  .connect(config.mongoUri)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

let swaggerDocument;
try {
  swaggerDocument = require("../public/swagger.json");
} catch (error) {
  console.warn("Warning: Swagger document not found. API docs won't be available.");
}

swaggerUi.setup(swaggerDocument)

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Register TSOA routes
RegisterRoutes(app);

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message,
    errors: err.errors,
  });
});

// Start server
const PORT = process.env["PORT"] || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
