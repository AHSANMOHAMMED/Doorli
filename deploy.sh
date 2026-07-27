#!/bin/bash

echo "🚀 Deploying Doorli Platform to Oracle Cloud (OCI)..."

# 1. Pull latest code changes if git repo exists
if [ -d ".git" ]; then
  echo "📦 Pulling latest changes from Git..."
  git pull origin main || echo "Git pull skipped or up to date."
fi

# 2. Rebuild and launch containers using Docker Compose
echo "🐳 Rebuilding and starting Docker containers..."
docker-compose down
docker-compose up -d --build

echo "✅ Deployment completed successfully!"
echo "🌐 Super Admin (live): http://doorli.me/admin"
echo "🌐 API Backend: http://doorli.me/api"
echo "🌐 Customer Web: http://doorli.me"
