# Multi-stage build for production. Build context is the repo root so the
# api workspace can pull in TS source from ../shared/units during compile.

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY api/package*.json ./api/
COPY api/tsconfig.json ./api/
COPY shared ./shared

RUN cd api && npm install --omit=dev --ignore-scripts && npm cache clean --force

COPY api/src ./api/src

RUN cd api && npm install
RUN cd api && npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

COPY api/package*.json ./

RUN npm install --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder /app/api/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/api/src/server.js"]
