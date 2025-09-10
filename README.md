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

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd runner-eta
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

5. **Build for production**

   ```bash
   pnpm build           # Production build with Turbopack
   pnpm start           # Start production server
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

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

Create a `.env.local` file for local development:

```env
# Database configuration
DATABASE_URL="postgresql://punctuality_user:punctuality_password@localhost:5432/punctuality_db?schema=public"

# Blockchain configuration
PRIVATE_KEY="your_wallet_private_key_here"

# Server configuration
NODE_ENV=development
PORT=3000
```

### Production Deployment

**Important**: This app uses a custom Socket.IO server (`server.js`) for real-time WebSocket connections.

- **Node.js hosting required** (not static hosting)
- **Supports**: Railway, Render, DigitalOcean, AWS EC2, etc.
- **HTTPS required** for geolocation API access
- **WebSocket support** needed for real-time features
- **PostgreSQL database** required for production use

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

**Fully integrated with Somnia Network:**

### Smart Contracts

- **PunctualityCore.sol**: Core betting contract with ETA calculations
- **IPunctualityProtocol.sol**: Interface definitions
- **Math.sol**: Helper library for calculations

### Web3 Features

- **Wallet Connection**: MetaMask integration with Somnia network support
- **Smart Contract Interaction**: Real blockchain calls for staking and betting
- **Real-time Updates**: WebSocket integration with blockchain events
- **Mobile-First**: Essential for mobile wallet integration

### Blockchain Integration

- **Somnia Testnet**: Deployed and tested on Somnia Testnet
- **Gas Estimation**: Built-in gas cost estimation
- **Transaction Handling**: Real transaction processing with error handling
- **Event Logging**: Comprehensive event logging for analytics

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
