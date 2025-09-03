# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Runner ETA** is a real-time location sharing application built with Next.js, TypeScript, and Socket.IO. It enables users to share live location updates with accurate ETA calculations based on running pace.

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
- **Real-time**: Socket.IO 4.8 with custom Node.js server (`server.js`)
- **Styling**: Tailwind CSS 4.1 (Oxide Engine) with glass morphism design
- **State Management**: Zustand 5.0 stores for location and UI state
- **Maps**: Leaflet 1.9 for interactive mapping
- **Build**: Next.js 15 Turbopack for 40-60% faster builds

### Key Architectural Components

#### Custom Socket.IO Server (`server.js`)
- **LocationService**: In-memory session management for active location sharing
- **Real-time Location Updates**: WebSocket-based location broadcasting
- **ETA Calculations**: Haversine formula for distance + pace-based time estimates
- **Session Management**: UUID-based sharing sessions with automatic cleanup

#### State Management (Zustand Stores)
- **locationStore**: Manages current location, sharing sessions, watched sessions, and pace settings
- **uiStore**: Handles toasts, map state, connection status, and loading states

#### Component Architecture
```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home page with mode selection
│   ├── plan/page.tsx      # Route planning interface  
│   ├── share/page.tsx     # Live tracking sharing
│   └── watch/[id]/page.tsx # Watch shared location
├── components/
│   ├── ui/                # Reusable UI components (Button, Toast, etc.)
│   ├── map/               # Map-specific components (MapContainer, etc.)
│   └── layout/            # Layout components (Navigation, ModeSwitch)
├── stores/                # Zustand state stores
├── types/                 # TypeScript type definitions
└── lib/                   # Utility functions
```

#### Real-time Data Flow
1. **Location Sharing**: User creates session → gets UUID → starts broadcasting location
2. **Location Updates**: GPS coordinates → Socket.IO → broadcast to watchers
3. **ETA Calculation**: Current location + destination + pace → distance calculation → ETA
4. **Session Management**: Automatic cleanup on disconnect, session deactivation

### Socket.IO Events
- `createSharingID`: Create new sharing session
- `updateLocation`: Broadcast location updates
- `setDestination`: Set destination for ETA calculation  
- `join`: Join sharing session as watcher
- `watch`: Receive location updates

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
The app uses a custom Node.js server (`server.js`) instead of Vercel's serverless functions to support real-time WebSocket connections. This means:
- Development runs on `http://localhost:3000` with both HTTP and WebSocket support
- Production requires a Node.js hosting environment (not static hosting)
- The Next.js app is integrated within the custom server using `next()` handler

### Location Services
- Requires HTTPS in production for geolocation API access
- GPS accuracy varies by device/browser - handle gracefully
- Location updates are throttled to prevent spam
- Path tracking stores coordinate history for route visualization

### Performance Considerations
- In-memory session storage (consider database for production scaling)
- Automatic session cleanup prevents memory leaks
- Map rendering optimized with Leaflet's built-in performance features
- Real-time updates use efficient room-based broadcasting

### Mobile Considerations
- Touch-optimized UI with proper tap targets
- Safe area CSS for iOS devices
- Responsive design works across all screen sizes
- GPS works well on mobile browsers with HTTPS

## Environment Setup

### Required Environment Variables
```bash
NODE_ENV=development       # Set to 'production' for production
PORT=3000                 # Server port (optional, defaults to 3000)
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
- Open sharing link in multiple tabs/devices
- Test connection drops and reconnections
- Verify ETA updates when location/destination changes

### UI Testing
- Test responsive design across device sizes
- Verify toast notifications work correctly
- Check map interactions on touch devices
