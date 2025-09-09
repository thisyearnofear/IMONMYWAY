#!/bin/bash

# Database Setup Script
# This script automates the setup of PostgreSQL for the Punctuality Protocol

set -e  # Exit on any error

echo "🚀 Starting Punctuality Protocol Database Setup..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install it first."
    echo "For macOS: brew install postgresql"
    echo "For Ubuntu: sudo apt install postgresql postgresql-contrib"
    exit 1
fi

echo "✅ PostgreSQL is installed"

# Check if PostgreSQL is running
if ! pg_isready &> /dev/null; then
    echo "⚠️  PostgreSQL is not running. Attempting to start..."
    
    # Try to start PostgreSQL based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew services start postgresql
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo systemctl start postgresql
    else
        echo "⚠️  Could not automatically start PostgreSQL. Please start it manually."
        exit 1
    fi
    
    # Wait a moment for PostgreSQL to start
    sleep 5
fi

echo "✅ PostgreSQL is running"

# Check if user exists, create if not
echo "🔧 Setting up database user and database..."

# Create database user and database
psql postgres << EOF
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'punctuality_user') THEN
        CREATE USER punctuality_user WITH PASSWORD 'punctuality_password';
    END IF;
END
\$\$;

CREATE DATABASE IF NOT EXISTS punctuality_db OWNER punctuality_user;
GRANT ALL PRIVILEGES ON DATABASE punctuality_db TO punctuality_user;
EOF

echo "✅ Database user and database created"

# Create .env.local file if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
# Database configuration
DATABASE_URL="postgresql://punctuality_user:punctuality_password@localhost:5432/punctuality_db?schema=public"

# Redis configuration (optional, for caching)
REDIS_URL="redis://localhost:6379"

# Blockchain configuration
PRIVATE_KEY="your_wallet_private_key_here"
EOF
    echo "✅ .env.local file created"
else
    echo "✅ .env.local file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🔧 Running database migrations..."
npx prisma migrate dev --name init

echo "🎉 Database setup completed successfully!"

echo ""
echo "Next steps:"
echo "1. Update the PRIVATE_KEY in .env.local with your actual wallet private key"
echo "2. Run the application with: pnpm dev"
echo "3. Access the app at http://localhost:3000"