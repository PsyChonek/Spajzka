#!/bin/bash

echo "Starting database seeding..."

mongoimport --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --db spajzka --collection users --file /docker-entrypoint-initdb.d/spajzka.users.json --jsonArray --drop --legacy

mongoimport --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --db spajzka --collection groups --file /docker-entrypoint-initdb.d/spajzka.groups.json --jsonArray --drop --legacy

mongoimport --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --db spajzka --collection items --file /docker-entrypoint-initdb.d/spajzka.items.json --jsonArray --drop --legacy

echo "Database seeding completed successfully!"
