import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Load development environment variables from .env.development file
if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: '.env.development' });
}

// Load production environment variables from .env.production file
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production' });
}

const config = {
  port: process.env.PORT ? process.env.PORT : (() => { throw new Error("PORT must be provided") })(),
  mongoUri: process.env.MONGO_URI ? process.env.MONGO_URI : (() => { throw new Error("MONGO_URI must be provided") })(),
  jwtSecret: process.env.JWT_SECRET ? process.env.JWT_SECRET : (() => { throw new Error("JWT_SECRET must be provided") })(),
  environment: process.env.NODE_ENV ? process.env.NODE_ENV : (() => { throw new Error("NODE_ENV must be provided") })(),
};

export default config;
