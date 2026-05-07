#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is required"
  exit 1
fi

echo "Running database migrations..."
npx prisma migrate deploy

echo "Bootstrapping admin user and settings..."
npm run db:bootstrap

echo "Starting MyPets..."
exec node server.js
