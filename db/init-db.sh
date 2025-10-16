#!/bin/bash
set -e

echo "=== Spajzka Database Initialization ==="

# Wait for MongoDB to be ready
until mongosh --host localhost --eval "db.adminCommand('ping')" >/dev/null 2>&1; do
  echo "Waiting for MongoDB to be ready..."
  sleep 2
done

echo "MongoDB is ready!"

# Run installation script (system data: roles, global items)
echo "Running installation script..."
node /docker-entrypoint-initdb.d/install.js

# Run seed script only in dev environment
if [ "$NODE_ENV" = "development" ]; then
  echo "Development environment detected. Running seed script..."
  node /docker-entrypoint-initdb.d/seed.js
else
  echo "Production environment. Skipping seed data."
fi

# Run migration script to update existing data
echo "Running migration script..."
node /docker-entrypoint-initdb.d/migrate.js

echo "=== Database initialization complete! ==="
