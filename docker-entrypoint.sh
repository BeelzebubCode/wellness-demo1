#!/bin/sh
set -e

# Run migrations
echo "Runnning database migrations..."
npx prisma migrate deploy

# Optional: Run seed (uncomment if needed, but be careful of duplicates)
# echo "Running database seed..."
# npx prisma db seed

# Start the application
echo "Starting application..."
exec node server.js
