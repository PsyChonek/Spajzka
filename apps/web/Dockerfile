# Base stage with dependencies
FROM node:18-alpine AS base
WORKDIR /app

# Copy package files from root and web workspace
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages ./packages

# Install dependencies stage
FROM base AS dependencies
RUN npm install --workspace=web

# Build stage
FROM dependencies AS build
WORKDIR /app/apps/web

# Copy web source files
COPY apps/web/ ./

# Build argument for API URL
ARG REACT_APP_SpajzkaAPI=http://localhost:3010
ENV REACT_APP_SpajzkaAPI=$REACT_APP_SpajzkaAPI

# Build the React app
RUN npm run build

# Production stage with nginx
FROM nginx:alpine AS production

# Copy custom nginx config
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from build stage
COPY --from=build /app/apps/web/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
