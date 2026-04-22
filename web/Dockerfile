# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files (context is repo root; the web/ workspace references
# ../shared/api-client via a path alias, so shared/ must be inside the
# build context).
COPY web/package*.json ./web/
COPY shared ./shared

WORKDIR /app/web

RUN npm install

# shared/api-client imports axios / form-data — Node module resolution
# walks up from the importer, so expose web/node_modules at /app as well.
RUN ln -s /app/web/node_modules /app/node_modules

# Copy the rest of web/
COPY web/ ./

RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/web/dist /usr/share/nginx/html

# Copy nginx configuration
COPY web/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
