# Base stage with dependencies
FROM node:18-alpine AS base
WORKDIR /app

# Copy package files
COPY apps/api/package*.json ./apps/api/

# Install dependencies stage
FROM base AS dependencies
WORKDIR /app/apps/api
RUN npm install

# Build stage
FROM dependencies AS build
WORKDIR /app/apps/api

# Copy API source files
COPY apps/api/ ./

# Generate TSOA routes and specs, then build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app/apps/api

# Install production dependencies only
COPY apps/api/package*.json ./
RUN npm install --omit=dev

# Copy built files from build stage
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/public ./public
COPY --from=build /app/apps/api/tsoa.json ./tsoa.json

WORKDIR /app/apps/api

# Expose API port
EXPOSE 3010

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3010/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/index.js"]
