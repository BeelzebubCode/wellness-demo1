#!/bin/bash
set -e

echo "🚀 Starting Deployment..."

# 1. Stop old containers (optional, but good for clean env)
docker compose down --remove-orphans || true

# 2. Start Containers (App, DB, Redis)
echo "📦 Building and Starting Containers..."
docker compose up -d --build

# 3. Wait for Database to be ready
echo "⏳ Waiting for Database to initialize (10s)..."
sleep 10

# 4. Run Migrations (From Host Machine -> Docker DB)
# Note: Using npx here assumes Node is available on host.
# If not, use 'docker compose exec app prisma migrate deploy'
echo "🔄 Running Database Migrations..."
npx prisma migrate deploy

# 5. Optional Seed
if [ "$1" == "--seed" ]; then
  echo "🌱 Seeding Database..."
  npm run db:seed
fi

echo "✅ App Deployed Successfully!"
echo "----------------------------------------"

# 6. Check Status
./scripts/deploy-check.sh
