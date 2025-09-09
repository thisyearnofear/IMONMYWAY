# Database Setup Guide

## Prerequisites

1. Install PostgreSQL (version 13 or higher recommended)
2. Install Node.js (version 18 or higher)
3. Install pnpm (package manager)

## PostgreSQL Installation

### macOS
```bash
# Using Homebrew
brew install postgresql

# Start PostgreSQL service
brew services start postgresql
```

### Ubuntu/Debian
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Windows
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer and follow the setup wizard
3. Make sure to note the password you set for the postgres user

## Database Setup

### 1. Create Database and User

```bash
# Connect to PostgreSQL as superuser
psql postgres

# Create database user
CREATE USER punctuality_user WITH PASSWORD 'punctuality_password';

# Create database
CREATE DATABASE punctuality_db OWNER punctuality_user;

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE punctuality_db TO punctuality_user;

# Exit PostgreSQL
\q
```

### 2. Update Environment Variables

Create a `.env.local` file in the project root with the following content:

```env
# Database configuration
DATABASE_URL="postgresql://punctuality_user:punctuality_password@localhost:5432/punctuality_db?schema=public"

# Redis configuration (optional, for caching)
REDIS_URL="redis://localhost:6379"

# Blockchain configuration
PRIVATE_KEY="your_wallet_private_key_here"
```

### 3. Install Database Dependencies

```bash
# Install project dependencies
pnpm install

# Install Prisma CLI globally (if not already installed)
pnpm add -g prisma
```

### 4. Generate Prisma Client

```bash
# Generate Prisma client
npx prisma generate
```

### 5. Run Database Migrations

```bash
# Apply database migrations
npx prisma migrate dev --name init
```

### 6. Seed Database (Optional)

```bash
# Seed database with initial data
npx prisma db seed
```

## Troubleshooting

### Common Issues

1. **Connection refused**: Make sure PostgreSQL is running
   ```bash
   # Check PostgreSQL status
   pg_isready
   
   # Start PostgreSQL if not running
   brew services start postgresql  # macOS
   sudo systemctl start postgresql  # Ubuntu
   ```

2. **Authentication failed**: Verify database credentials in `.env.local`

3. **Permission denied**: Make sure the database user has proper privileges

### Reset Database (Development Only)

```bash
# Reset database (WARNING: This will delete all data)
npx prisma migrate reset
```

## Production Deployment

For production deployment, make sure to:

1. Use a secure password for the database user
2. Configure proper firewall rules
3. Use connection pooling
4. Set up automated backups
5. Monitor database performance

## Alternative: Using Docker

If you prefer to use Docker for database management:

### 1. Install Docker

Follow instructions at https://docs.docker.com/get-docker/

### 2. Run PostgreSQL Container

```bash
docker run -d \
  --name punctuality-postgres \
  -e POSTGRES_USER=punctuality_user \
  -e POSTGRES_PASSWORD=punctuality_password \
  -e POSTGRES_DB=punctuality_db \
  -p 5432:5432 \
  postgres:15
```

### 3. Update Environment Variables

```env
DATABASE_URL="postgresql://punctuality_user:punctuality_password@localhost:5432/punctuality_db?schema=public"
```

Then follow steps 3-6 from the regular setup guide.