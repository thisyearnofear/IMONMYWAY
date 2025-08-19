# Runner ETA - Next.js Edition

A modern, real-time location sharing application built with Next.js, TypeScript, and Socket.IO. Share your live location and ETA with real-time tracking capabilities.

## 🚀 Features

- **Real-time Location Tracking**: Share your live location with instant updates
- **ETA Calculation**: Accurate arrival time estimates based on pace and distance
- **Route Planning**: Plan runs with start and end points
- **Interactive Maps**: Powered by Leaflet with custom markers and paths
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **TypeScript**: Full type safety throughout the application
- **Socket.IO**: Real-time WebSocket communication
- **Zustand**: Efficient state management

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Maps**: Leaflet
- **Real-time**: Socket.IO
- **State Management**: Zustand
- **Build Tool**: Next.js built-in bundler

## 🏃‍♂️ Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

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
   npm run dev
   ```

4. **Open your browser**
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
The app is ready for deployment on platforms like Vercel, Netlify, or any Node.js hosting service.

## 🚀 Future Enhancements

This codebase is designed to be blockchain and AI-ready:

### Blockchain Integration Ready
- TypeScript foundation for Web3 development
- Modular architecture for smart contract integration
- Real-time data perfect for blockchain events
- State management ready for wallet connections

### AI Integration Ready
- Clean API structure for ML model integration
- Real-time data pipeline for AI processing
- Modular components for AI-powered features
- TypeScript types for AI service integration

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