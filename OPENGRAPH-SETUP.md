# OpenGraph Backend Setup Guide

This guide explains how to set up and use the OpenGraph backend for enhanced tab previews in Tabli.

## Quick Start

### 1. Start the Backend Server

```bash
cd og-backend
./start-dev.sh
```

Or manually:

```bash
cd og-backend
npm install
npm run dev
```

The server will start on `http://localhost:3001`

### 2. Build and Use the Extension

```bash
# In the main tabli directory
npm run build-dev
```

Load the extension in Chrome and the tab previews will now use real OpenGraph data!

## What's Included

### Backend (`og-backend/`)

- **Express.js server** with TypeScript
- **OpenGraph scraping** using `open-graph-scraper`
- **In-memory caching** with 1-hour TTL
- **CORS support** for browser extensions
- **Health check** and cache management endpoints

### Client (`src/ts/ogClient.ts`)

- **Browser-side caching** for fast repeat access
- **Automatic fallbacks** when backend is unavailable
- **Error handling** with graceful degradation
- **Cache statistics** and management

### Integration

- **TabPreview component** now uses real OpenGraph data
- **Automatic backend detection** - falls back gracefully if offline
- **Development-friendly** - works with localhost:3001

## Features

### Backend Endpoints

- `GET /api/og?url=<url>` - Fetch OpenGraph data
- `GET /api/health` - Health check
- `GET /api/cache/stats` - Cache statistics  
- `DELETE /api/cache` - Clear cache

### Client Features

- **Dual-layer caching**: Backend cache + browser cache
- **Smart fallbacks**: Continues working when backend is down
- **Performance optimized**: Minimal network requests
- **Developer tools**: Cache stats and management

## Development Workflow

1. **Start backend**: `cd og-backend && ./start-dev.sh`
2. **Build extension**: `npm run build-dev`
3. **Load in Chrome**: Load unpacked extension from `build/`
4. **Test previews**: Hover over tabs and click expand buttons

## Production Deployment

### Backend Deployment

The backend can be deployed to any Node.js hosting service:

```bash
cd og-backend
npm run build
npm start
```

### Extension Configuration

Update the `baseUrl` in `ogClient.ts` to point to your production server:

```typescript
const ogClient = new OpenGraphClient('https://your-backend.com');
```

## Troubleshooting

### Backend Not Starting

- Check Node.js is installed (v16+)
- Verify port 3001 is available
- Check the console for error messages

### No Previews Showing

- Verify backend is running: `curl http://localhost:3001/api/health`
- Check browser console for errors
- Ensure extension has network permissions

### Cache Issues

- Clear backend cache: `curl -X DELETE http://localhost:3001/api/cache`
- Clear browser cache: Reload extension
- Check cache stats: `curl http://localhost:3001/api/cache/stats`

## Customization

### Timeout and Retry Settings

Edit `og-backend/src/server.ts`:

```typescript
const options = {
    url: url,
    timeout: 10000,  // Adjust timeout
    retry: 2         // Adjust retry count
};
```

### Cache TTL

Edit cache TTL in both places:

- Backend: `og-backend/src/server.ts` - `CACHE_TTL`
- Client: `src/ts/ogClient.ts` - `cacheTTL`

### Custom User Agent

Edit `og-backend/src/server.ts`:

```typescript
headers: {
    'User-Agent': 'Your-Custom-Bot/1.0'
}
```

## Performance Notes

- **First load**: ~300-1000ms (network fetch)
- **Cached load**: ~1-5ms (memory lookup)
- **Backend cache**: Shared across all extension instances
- **Client cache**: Per-browser instance

The combination provides excellent performance while minimizing server load.