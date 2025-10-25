#!/bin/bash
# Deploy backend to Hetzner VPS

set -e

echo "🚀 Deploying IMONMYWAY Backend to Hetzner..."

# Configuration
SERVER_IP="157.180.36.156"
SERVER_USER="root"  # Change to your username
APP_DIR="/var/www/imonmyway-backend"
PM2_APP_NAME="imonmyway-backend"

echo "📦 Building application..."
npm run build

echo "📁 Creating deployment package..."
tar -czf deploy.tar.gz \
  backend-server.js \
  package.json \
  package-lock.json \
  prisma/ \
  .env.production \
  ecosystem.config.js

echo "🔄 Uploading to server..."
scp deploy.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

echo "🔧 Setting up on server..."
ssh $SERVER_USER@$SERVER_IP << 'EOF'
  # Create app directory
  sudo mkdir -p /var/www/imonmyway-backend
  cd /var/www/imonmyway-backend
  
  # Extract files
  sudo tar -xzf /tmp/deploy.tar.gz
  
  # Install dependencies
  sudo npm install --production
  
  # Set up database
  sudo npx prisma migrate deploy
  sudo npx prisma generate
  
  # Restart PM2 process
  sudo pm2 delete imonmyway-backend || true
  sudo pm2 start ecosystem.config.js
  sudo pm2 save
  
  # Clean up
  rm /tmp/deploy.tar.gz
EOF

echo "✅ Deployment complete!"
echo "🔗 Backend running at: http://$SERVER_IP:3001"
echo "📊 Monitor with: ssh $SERVER_USER@$SERVER_IP 'pm2 logs imonmyway-backend'"

rm deploy.tar.gz