# IMONMYWAY - Punctuality Protocol

> **Put your money where your mouth is.** Stake tokens on your punctuality and let others bet on your success.

A decentralized betting protocol that combines real-time location tracking with financial accountability, built for the Somnia DeFi Mini Hackathon.

## ✨ Features

- **🔗 Staked Commitments**: Put tokens on the line for punctuality
- **🎲 Social Betting**: Friends bet on your success for added accountability
- **📍 GPS Verification**: Blockchain-verified proof of arrival
- **⭐ Reputation System**: Reliability scoring affects betting odds
- **📱 Real-time Tracking**: Live location updates via WebSocket
- **🎨 Enhanced UX**: Delightful animations, haptic feedback, achievement celebrations, and smooth Web3 onboarding
- **🤖 Smart Recommendations**: AI-powered stake suggestions based on user behavior and context
- **⚡ Optimistic Updates**: Instant feedback for all user actions
- **📱 Performance Adaptive**: Smooth experience across all devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.5, React 19.1, TypeScript 5.9
- **Backend**: Node.js with Socket.IO for real-time communication
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS 4.1 (Oxide Engine)
- **Maps**: Leaflet 1.9 with custom markers and real-time paths
- **State**: Zustand 5.0 with persistence and DevTools
- **Blockchain**: Solidity smart contracts on Somnia Network
- **Build**: Next.js 15 Turbopack (40-60% faster builds)

## 🏃‍♂️ Getting Started

### Prerequisites

- **Node.js 18+** (Node.js 20+ recommended for best performance)
- **pnpm** (package manager)
- **PostgreSQL 13+** (for database)
- **Modern browser** with WebSocket and Geolocation support
- **HTTPS required** in production for GPS access

### Local Development Setup

1. **Clone the repository**

    ```bash
    git clone <your-repo-url>
    cd imonmyway
    ```

2. **Install dependencies**

    ```bash
    pnpm install
    ```

3. **Set up the database**

    Follow the detailed database setup guide in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

    Or use the automated setup script:

    ```bash
    ./scripts/setup-database.sh
    ```

4. **Start the development server**

    ```bash
    pnpm dev              # Development with hot reload + Socket.IO
    ```

5. **Open your browser**
    Navigate to [http://localhost:3000](http://localhost:3000)

### Production Deployment

#### Frontend Deployment (Netlify)

1. **Build the frontend**

    ```bash
    pnpm build
    ```

2. **Deploy to Netlify**
    - Connect your GitHub repository to Netlify
    - Set build command: `pnpm build`
    - Set publish directory: `out`
    - Your frontend will be available at: `https://your-app.netlify.app`

#### Backend Deployment (Server)

1. **Upload backend files to your server**

    ```bash
    # Upload the backend files
    scp server.js package.json user@your-server:/var/www/your-app-backend/
    scp backend-server.js user@your-server:/var/www/your-app-backend/
    ```

2. **Install dependencies on server**

    ```bash
    ssh user@your-server
    cd /var/www/your-app-backend
    npm install --production
    ```

3. **Start the backend with PM2**

    ```bash
    # For development/testing
    NODE_ENV=production PORT=3001 node server.js

    # For production with PM2
    pm2 start backend-server.js --name your-app-backend
    pm2 save
    pm2 startup
    ```

4. **Configure Nginx (if using)**

    Create `/etc/nginx/sites-available/your-app-backend`:

    ```nginx
    server {
        listen 80;
        server_name your-server-ip-or-domain;

        location /socket.io/ {
            proxy_pass http://localhost:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location / {
            proxy_pass http://localhost:3001;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    ```

5. **Enable the site and reload Nginx**

    ```bash
    ln -sf /etc/nginx/sites-available/your-app-backend /etc/nginx/sites-enabled/
    nginx -t
    nginx -s reload
    ```

#### Current Deployment Status

- **Frontend**: ✅ Deployed at `https://imonmyway.netlify.app`
- **Backend**: ✅ Deployed at `http://157.180.36.156` (Hetzner server)
- **Database**: PostgreSQL with Prisma ORM
- **WebSocket**: Socket.IO for real-time communication

## 📱 Usage

### Plan a Run

1. Go to the home page
2. Click "Plan Route"
3. Enter start and end addresses
4. Set your target pace
5. View calculated distance and ETA
6. Share your planned route

### Live Tracking

1. Click "Start Sharing" from the home page
2. Allow location permissions
3. Set your pace (minutes per mile)
4. Click "Create Share Link"
5. Click on the map to set a destination
6. Share the generated link with others

### Watch Someone

1. Open a shared tracking link
2. View real-time location updates
3. See live ETA calculations
4. Monitor route progress

## 📚 Documentation

For detailed information about the project:

- **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)**: System design, smart contracts, database setup, deployment, and technical implementation
- **[`docs/COMPLIANCE.md`](docs/COMPLIANCE.md)**: Core principles compliance, consolidation achievements, functionality preservation, and user experience improvements
- **[`docs/FEATURES.md`](docs/FEATURES.md)**: Core features, user flows, enhancements, roadmap, and development status

## 🔧 Configuration

### Environment Variables

#### Frontend (.env.local)

Create a `.env.local` file for local development:

```env
# Database configuration
DATABASE_URL="postgresql://punctuality_user:punctuality_password@localhost:5432/punctuality_db?schema=public"

# Blockchain configuration
PRIVATE_KEY="your_wallet_private_key_here"

# Server configuration
NODE_ENV=development
PORT=3000

# Socket.IO configuration (for production)
NEXT_PUBLIC_SOCKET_URL="http://157.180.36.156"
```

#### Backend Environment Variables

For production backend deployment:

```env
# Server configuration
NODE_ENV=production
PORT=3001

# Database (if using)
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# CORS origins (comma-separated)
CORS_ORIGINS="https://imonmyway.netlify.app,http://localhost:3000"
```

#### PM2 Ecosystem Configuration

Create `ecosystem.config.js` for PM2:

```javascript
module.exports = {
  apps: [{
    name: 'imonmyway-backend',
    script: 'backend-server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
```

### Production Deployment

**Important**: This app uses a custom Socket.IO server (`backend-server.js`) for real-time WebSocket connections.

- **Node.js hosting required** (not static hosting)
- **Supports**: Railway, Render, DigitalOcean, AWS EC2, Hetzner, etc.
- **HTTPS required** for geolocation API access
- **WebSocket support** needed for real-time features
- **PostgreSQL database** required for production use
- **Somnia mainnet** configured and ready for production
- **PM2 recommended** for process management
- **Nginx recommended** for reverse proxy and SSL termination

#### Deployment Checklist

- [x] Frontend deployed to Netlify
- [x] Backend deployed to Hetzner server
- [x] PM2 process management configured
- [x] Nginx reverse proxy set up
- [x] Socket.IO CORS configured
- [x] Health endpoint responding
- [ ] SSL certificates (optional)
- [ ] Custom domain (optional)

## 📱 Mobile Optimization

**Built Mobile-First**

- **Touch-optimized UI** with proper tap targets (44px minimum)
- **Safe area handling** for iPhone notches and Android navigation
- **PWA-ready** for home screen installation
- **Offline-capable** map caching
- **Battery efficient** location tracking with smart throttling
- **Glass morphism effects** optimized for mobile performance

### Testing Location Features

- **Chrome DevTools**: Use Sensors tab for GPS simulation
- **Multiple devices**: Test real-time sync across phones/tablets
- **Network conditions**: Test with slow 3G to ensure performance

## ⚡ Performance

**Blazing Fast**

- **React 19 Compiler**: Automatic optimizations (40-60% faster)
- **Next.js 15 Turbopack**: Lightning-fast builds and HMR
- **Tailwind 4 Oxide**: 10x faster CSS compilation
- **Smart bundling**: Route-based code splitting
- **WebSocket efficiency**: Room-based broadcasting reduces overhead

### Build Performance

```bash
✓ Compiled successfully in 1.6s     # Optimized build performance
✓ Linting and checking validity    # TypeScript 5.9 performance
✓ Generating static pages (6/6)    # Pre-rendered at build time
```

## 💻 Development

### Available Commands

```bash
pnpm dev              # Start development server with hot reload
pnpm build           # Production build with optimizations
pnpm start           # Start production server
pnpm lint            # ESLint with Next.js 15 rules
```

### Development Features

- **Hot Module Replacement**: Instant updates without losing state
- **TypeScript Strict Mode**: Catch errors at compile time
- **ESLint 9**: Latest linting rules for React 19 + Next.js 15
- **Path Aliases**: Clean imports with `@/*` syntax
- **Socket.IO DevTools**: Real-time connection debugging

### Architecture Decisions

- **Custom Server**: Required for Socket.IO WebSocket support
- **PostgreSQL Database**: Required for production use (in-memory for development)
- **Zustand over Redux**: Simpler state management, better TypeScript support
- **CSS-in-CSS**: Raw CSS over CSS-in-JS for better Tailwind 4 performance

## 🚀 Web3 Integration

**Production ready on Somnia Mainnet:**

### Smart Contracts

- **PunctualityCore.sol**: Core betting contract with ETA calculations
- **IPunctualityProtocol.sol**: Interface definitions
- **Math.sol**: Helper library for calculations

### Web3 Features

- **Wallet Connection**: MetaMask integration with Somnia mainnet
- **Smart Contract Interaction**: Real blockchain calls for staking and betting
- **Real-time Updates**: WebSocket integration with blockchain events
- **Mobile-First**: Essential for mobile wallet integration

### Blockchain Integration

- **Somnia Mainnet**: Production deployment on chainId 50312
- **Contract Address**: `0xE93ECD999526BBBaCd35FA808E6F590BB1017246`
- **Gas Estimation**: Built-in gas cost estimation
- **Transaction Handling**: Real transaction processing with error handling
- **Event Logging**: Comprehensive event logging for analytics

## 🔧 Troubleshooting

### Backend Connection Issues

**Problem**: Frontend can't connect to backend
```bash
# Check if backend is running
ssh user@your-server "pm2 status"

# Check backend logs
ssh user@your-server "pm2 logs imonmyway-backend --lines 20"

# Test health endpoint
curl http://157.180.36.156/health
```

**Problem**: Socket.IO connection fails
- Ensure CORS origins include your frontend domain
- Check that Nginx is properly configured for WebSocket upgrades
- Verify firewall allows port 80/443

### Database Issues

**Problem**: Database connection fails
```bash
# Test database connection
npx prisma db push

# Check database logs
# (depends on your database setup)
```

### Build Issues

**Problem**: Build fails
```bash
# Clear cache and reinstall
rm -rf node_modules .next
pnpm install
pnpm build
```

### Performance Issues

**Problem**: Slow loading times
- Check PM2 logs for memory issues
- Monitor server resources
- Consider scaling up server resources

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with Next.js and the React ecosystem
- Maps powered by OpenStreetMap and Leaflet
- Real-time communication via Socket.IO
- Database management with Prisma and PostgreSQL
- Blockchain integration with ethers.js and Solidity
