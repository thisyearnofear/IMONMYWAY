# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**IMONMYWAY** is a decentralized betting protocol that combines real-time location tracking with financial accountability. Users stake tokens on their punctuality commitments and let others bet on their success. Built with Next.js, TypeScript, Socket.IO, and smart contracts on Somnia Network.

## Common Development Commands

### Development Server
```bash
npm run dev              # Start development server with Socket.IO on port 3000
```

### Building and Production
```bash
npm run build           # Build the Next.js application
npm start              # Start production server with Socket.IO
```

### Code Quality
```bash
npm run lint           # Run ESLint with Next.js configuration
```

### Testing Location Features
Since this is a location-based app, test with:
- Multiple browser tabs to simulate different users
- Chrome DevTools location override (Sensors tab) for GPS simulation
- Different network conditions to test real-time updates

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15.5 with App Router, React 19.1, TypeScript 5.9
- **Backend**: Standalone Socket.IO server (`backend/backend-server.js`) for real-time features
- **Database**: PostgreSQL with Prisma ORM for production data
- **Blockchain**: Solidity smart contracts on Somnia Network
- **Styling**: Tailwind CSS 4.1 (Oxide Engine) with glass morphism design
- **State Management**: Zustand 5.0 stores for location, betting, and UI state
- **Maps**: Leaflet 1.9 for interactive mapping and route planning
- **Build**: Next.js 15 Turbopack for 40-60% faster builds

### Key Architectural Components

#### Standalone Socket.IO Backend (`backend/backend-server.js`)
- **LocationService**: In-memory session management for active location sharing and betting sessions
- **Real-time Location Updates**: WebSocket-based location broadcasting for live tracking
- **ETA Calculations**: Haversine formula for distance + pace-based time estimates
- **Betting Integration**: Real-time betting odds updates and commitment tracking
- **Session Management**: UUID-based sharing sessions with automatic cleanup
- **Health Checks**: Built-in `/health` endpoint for monitoring
- **CORS Configuration**: Properly configured for Netlify frontend domain

#### State Management (Zustand Stores)
- **locationStore**: Manages current location, sharing sessions, watched sessions, and pace settings
- **uiStore**: Handles toasts, map state, connection status, and loading states

#### Component Architecture
```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home page with betting interface
│   ├── plan/page.tsx      # Route planning and commitment creation
│   ├── share/page.tsx     # Live tracking with betting integration
│   ├── watch/[id]/page.tsx # Watch shared location and place bets
│   ├── leaderboard/       # Reputation and betting leaderboard
│   └── profile/           # User profile and betting history
├── components/
│   ├── ui/                # Reusable UI components (Button, Toast, etc.)
│   ├── map/               # Map-specific components (MapContainer, etc.)
│   ├── wallet/            # Web3 wallet connection components
│   ├── betting/           # Betting interface components
│   ├── reputation/        # Reputation and achievement displays
│   └── layout/            # Layout components (Navigation, ModeSwitch)
├── stores/                # Zustand state stores
│   ├── locationStore.ts   # Location and tracking state
│   └── uiStore.ts         # UI and betting state
├── contracts/             # Smart contract ABIs and addresses
├── types/                 # TypeScript type definitions
└── lib/                   # Utility functions
backend/
└── backend-server.js      # Standalone Socket.IO server for real-time features
```

#### Real-time Data Flow
1. **Commitment Creation**: User creates punctuality commitment → stakes tokens → gets UUID session
2. **Location Sharing**: GPS coordinates → Socket.IO → broadcast to watchers and bettors
3. **Betting Integration**: Real-time odds updates → bet placement → live betting feed
4. **ETA Calculation**: Current location + destination + pace → distance calculation → ETA
5. **Blockchain Integration**: On-time arrival → smart contract execution → token distribution
6. **Session Management**: Automatic cleanup on disconnect, session deactivation

### Socket.IO Events
- `createSharingID`: Create new location sharing session with betting integration
- `updateLocation`: Broadcast location updates with real-time betting odds
- `setDestination`: Set destination for ETA calculation and betting settlement
- `join`: Join sharing session as watcher or bettor
- `watch`: Receive location updates and betting data
- `placeBet`: Place bet on user's punctuality
- `bettingUpdate`: Real-time betting odds and pool updates

### Development Patterns

#### Location Handling
- Always handle location permission requests gracefully
- Use `LocationData` interface for consistent location format
- Store path history for route visualization
- Implement fallback for GPS unavailability

#### Real-time Updates
- Socket.IO manages WebSocket connections automatically
- Session cleanup happens on disconnect
- Use rooms for efficient broadcasting to watchers
- Handle connection state in `uiStore`

#### TypeScript Usage  
- Strict type checking enabled
- Custom interfaces in `src/types/index.ts`
- Socket.IO events are fully typed
- Use path aliases (`@/*`) for clean imports

#### Tailwind CSS
- Custom utilities in `globals.css`
- Mobile-first responsive design
- Safe area handling for mobile devices
- Gradient backgrounds and modern UI patterns

## Development Notes

### Socket.IO Integration
The app uses a standalone Socket.IO backend server (`backend/backend-server.js`) for real-time WebSocket connections, separate from the Next.js frontend. This architecture provides:
- **Development**: Frontend on `http://localhost:3000`, backend on `http://localhost:3001`
- **Production**: Frontend on Netlify CDN, backend on Hetzner VPS with PM2 process management
- **Scalability**: Backend can be scaled independently with nginx reverse proxy
- **Security**: Dedicated backend with proper CORS configuration for production domains

### Location Services
- Requires HTTPS in production for geolocation API access
- GPS accuracy varies by device/browser - handle gracefully
- Location updates are throttled to prevent spam
- Path tracking stores coordinate history for route visualization

### Performance Considerations
- **Backend**: Standalone Socket.IO server with PM2 clustering support
- **Database**: PostgreSQL with Prisma ORM for production data persistence
- **Caching**: In-memory session storage with Redis consideration for scaling
- **Load Balancing**: nginx reverse proxy for backend distribution
- **Monitoring**: Health check endpoints and PM2 process monitoring
- **Real-time**: Efficient room-based broadcasting with connection limits

### Mobile Considerations
- Touch-optimized UI with proper tap targets
- Safe area CSS for iOS devices
- Responsive design works across all screen sizes
- GPS works well on mobile browsers with HTTPS

## Environment Setup

### Required Environment Variables
```bash
# Frontend (.env.local)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001  # Backend Socket.IO URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000    # Frontend URL

# Backend (.env.production)
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@host:5432/imonmyway_prod
ALLOWED_ORIGINS=https://imonmyway.netlify.app
```

### Browser Compatibility
- Modern browsers with geolocation API support
- WebSocket support required for real-time features
- Works on mobile browsers (iOS Safari, Chrome Mobile)

## Testing Strategies

### Location Testing
- Use Chrome DevTools → Sensors → Location override for GPS simulation
- Test with multiple browser tabs to simulate multiple users
- Test offline/online scenarios for connection handling

### Real-time Testing
- Open sharing link in multiple tabs/devices to test betting interactions
- Test connection drops and reconnections with betting state preservation
- Verify ETA updates when location/destination changes affect betting odds
- Test blockchain integration with mock transactions
- Simulate on-time/late arrivals to test smart contract execution

### UI Testing
- Test responsive design across device sizes
- Verify toast notifications work correctly
- Check map interactions on touch devices
