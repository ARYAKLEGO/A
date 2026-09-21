# Elevation Detector

A **complex APK application** that detects **real elevation/height** of locations using **100% free maps** (OpenStreetMap) with **pin-based interaction**. Users tap the map to place pins and see real elevation data from **SRTM/NASA** via the **Open-Elevation API**.

## Features

- **Real Elevation Data**: Uses Open-Elevation API (SRTM/NASA data) - **not simulation**
- **100% Free Maps**: OpenStreetMap tiles (no Google Maps, no API keys required)
- **Pin-Based Interaction**: Tap anywhere on the map to place a pin and get elevation
- **Multiple Map Types**: Standard, Terrain, Satellite views
- **Multiple Pins**: Add unlimited pins to track different locations
- **Elevation Statistics**: Min, Max, Average elevation with gain/loss calculations
- **Elevation Profile**: Visual graph showing elevation changes between pins
- **History System**: Save and load previous sessions
- **GPX Export**: Export all pins as GPX track file
- **Dark Mode**: Full dark mode support
- **Unit Conversion**: Switch between meters and feet
- **Search**: Find locations using Nominatim (OpenStreetMap geocoding)
- **My Location**: Center map on current GPS position
- **Responsive Design**: Works on mobile and desktop

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + Custom CSS
- **Animations**: Framer Motion
- **Maps**: Leaflet.js 1.9.4 + OpenStreetMap
- **Elevation API**: [Open-Elevation](https://open-elevation.com/) (Free, no API key)
- **Geocoding**: Nominatim (OpenStreetMap)
- **Mobile**: Capacitor 6 (Android APK)
- **Build**: GitHub Actions

## Quick Start

### Web Development
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build
```

### Build APK
1. Install Capacitor CLI globally: `npm install -g @capacitor/cli`
2. Add Android platform: `npx cap add android`
3. Sync with web assets: `npx cap sync android`
4. Build APK: `npx cap open android` (then build in Android Studio)

Or use **GitHub Actions** to automatically build the APK.

## Project Structure

```
elevation-detector/
├── src/
│   ├── App.tsx           # Main application component
│   ├── main.tsx          # React entry point
│   ├── index.css         # Global styles (Tailwind + Custom)
│   ├── types/
│   │   └── index.ts      # TypeScript type definitions
│   ├── hooks/
│   │   ├── useMap.ts     # Leaflet map management
│   │   ├── useElevation.ts # Elevation data fetching
│   │   └── useSettings.ts # App settings management
│   └── lib/
│       ├── elevation.ts  # Open-Elevation API wrapper
│       ├── geocoding.ts  # Nominatim geocoding
│       ├── storage.ts    # LocalStorage persistence
│       └── gpx.ts        # GPX export functionality
├── package.json
├── tsconfig.json
├── vite.config.ts
├── capacitor.config.ts
└── README.md
```

## APIs Used

### Open-Elevation API
- **Endpoint**: `https://api.open-elevation.com/api/v1/lookup`
- **Purpose**: Get real elevation data from SRTM/NASA
- **Cost**: FREE (no API key required)
- **Rate Limit**: 50 requests per second

### Nominatim (OpenStreetMap)
- **Endpoint**: `https://nominatim.openstreetmap.org/search`
- **Purpose**: Geocoding (address to coordinates)
- **Cost**: FREE (no API key required)
- **Rate Limit**: 1 request per second

## Usage

1. **Add a Pin**: Tap anywhere on the map to place a pin
2. **View Elevation**: The pin popup shows the elevation in meters/feet
3. **Add Multiple Pins**: Create a route or track multiple locations
4. **View Statistics**: See min/max/avg elevation and total gain/loss
5. **Elevation Profile**: Visual representation of elevation changes
6. **Search Locations**: Use the search bar to find places
7. **Save History**: Save your current session for later
8. **Export GPX**: Download all pins as a GPX file
9. **Change Settings**: Toggle dark mode, map type, and unit preference

## Building APK via GitHub Actions

The repository includes a GitHub Actions workflow that automatically builds the APK when you push to the main branch. The APK will be available as a downloadable artifact.

## License

MIT License - Feel free to use, modify, and distribute.

---

**Built with love using 100% free and open-source technologies.**
