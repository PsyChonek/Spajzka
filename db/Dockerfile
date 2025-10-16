# Production MongoDB Dockerfile
FROM mongo:7.0

# Install Node.js for running scripts
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV MONGO_INITDB_DATABASE=spajzka

# Copy install data and scripts
COPY install /docker-entrypoint-initdb.d/install
COPY install.js /docker-entrypoint-initdb.d/
COPY seed.js /docker-entrypoint-initdb.d/
COPY seed /docker-entrypoint-initdb.d/seed
COPY migrate.js /docker-entrypoint-initdb.d/

# Create init script that runs install, then seed (in dev), then migration
COPY init-db.sh /docker-entrypoint-initdb.d/

# Make init script executable
RUN chmod +x /docker-entrypoint-initdb.d/init-db.sh

# Expose MongoDB port
EXPOSE 27017
