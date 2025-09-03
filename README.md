# Runner ETA - Next.js Edition

A cutting-edge, real-time location sharing application built with the latest Next.js, React 19, and Socket.IO. Share your live location and ETA with blazing-fast real-time tracking capabilities.

## 🚀 Features

- **⚡ Real-time Location Tracking**: Share your live location with instant WebSocket updates
- **🎯 Accurate ETA Calculation**: Precise arrival time estimates using Haversine formula + pace
- **🗺️ Interactive Route Planning**: Plan runs with start/end points and live visualization
- **📱 Mobile-First Design**: Touch-optimized UI with safe area handling for iOS/Android
- **🎨 Glass Morphism UI**: Modern, responsive design with custom animations
- **🔒 Type-Safe**: Full TypeScript coverage with strict type checking
- **🔄 Real-time Sync**: Socket.IO WebSocket communication with automatic reconnection
- **⚡ Lightning Fast**: Zustand state management + React 19 compiler optimizations

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.5, React 19.1, TypeScript 5.9
- **Styling**: Tailwind CSS 4.1 (Oxide Engine)
- **Maps**: Leaflet 1.9 with custom markers and real-time paths
- **Real-time**: Socket.IO 4.8 with room-based broadcasting
- **State**: Zustand 5.0 with persistence and DevTools
- **Build**: Next.js 15 Turbopack (40-60% faster builds)

## 🏃‍♂️ Getting Started

### Prerequisites

- **Node.js 18+** (Node.js 20+ recommended for best performance)
- **npm 9+** or **yarn 1.22+**
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
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev              # Development with hot reload + Socket.IO
   ```

4. **Build for production**

   ```bash
   npm run build           # Production build with Turbopack
   npm start               # Start production server
   ```

5. **Open your browser**
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

## 🏗️ Architecture

### Frontend Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # Reusable React components
│   ├── ui/             # Basic UI components
│   ├── map/            # Map-related components
│   └── layout/         # Layout components
├── lib/                # Utility functions
├── stores/             # Zustand state stores
└── types/              # TypeScript type definitions
```

### Key Components

- **LocationStore**: Manages location data and sharing sessions
- **UIStore**: Handles UI state, toasts, and map controls
- **MapContainer**: Leaflet map wrapper with React integration
- **Socket Manager**: WebSocket connection management

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file for local development:

```env
NODE_ENV=development
PORT=3000
```

### Production Deployment

**Important**: This app uses a custom Socket.IO server (`server.js`) for real-time WebSocket connections.

- **Node.js hosting required** (not static hosting)
- **Supports**: Railway, Render, DigitalOcean, AWS EC2, etc.
- **HTTPS required** for geolocation API access
- **WebSocket support** needed for real-time features

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
✓ Compiled successfully in 3.6s     # vs 10-15s with older versions
✓ Linting and checking validity    # TypeScript 5.9 performance
✓ Generating static pages (6/6)    # Pre-rendered at build time
```

## 💻 Development

### Available Commands

```bash
npm run dev              # Start development server with hot reload
npm run build           # Production build with optimizations
npm run start           # Start production server
npm run lint            # ESLint with Next.js 15 rules
```

### Development Features

- **Hot Module Replacement**: Instant updates without losing state
- **TypeScript Strict Mode**: Catch errors at compile time
- **ESLint 9**: Latest linting rules for React 19 + Next.js 15
- **Path Aliases**: Clean imports with `@/*` syntax
- **Socket.IO DevTools**: Real-time connection debugging

### Architecture Decisions

- **Custom Server**: Required for Socket.IO WebSocket support
- **In-Memory Sessions**: Fast for development (consider database for production)
- **Zustand over Redux**: Simpler state management, better TypeScript support
- **CSS-in-CSS**: Raw CSS over CSS-in-JS for better Tailwind 4 performance

## 🚀 Web3 Integration Ready

**Perfect foundation for Web3 development:**

### Ready to Add

```bash
# When you're ready for Web3 features:
npm install wagmi viem @rainbow-me/rainbowkit @tanstack/react-query
```

### Web3-Ready Architecture

- **React 19**: Latest hooks and concurrent features for smooth wallet UX
- **TypeScript Strict**: Perfect for Web3 contract type safety
- **Zustand State**: Easily add wallet connection state
- **Real-time**: WebSocket perfect for blockchain events
- **Mobile-First**: Essential for mobile wallet integration

### Planned Web3 Features

- **Wallet Connection**: MetaMask, WalletConnect, Coinbase Wallet
- **Smart Contracts**: Location verification, route NFTs, reward tokens
- **Decentralized Storage**: IPFS for route data and achievements
- **Social Features**: Token-gated groups, leaderboards

### AI Integration Ready

- **Real-time Pipeline**: Perfect for AI-powered route optimization
- **TypeScript Types**: Ready for ML model integration
- **Performance**: React 19 compiler handles AI-heavy UIs efficiently
- **Mobile AI**: Optimized for on-device ML models

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
