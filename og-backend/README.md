# Tabli OpenGraph Backend

A simple Node.js/Express backend for fetching OpenGraph metadata for the Tabli browser extension.

## Features

- **OpenGraph Scraping**: Fetches title, description, and image from web pages
- **Caching**: In-memory cache with 1-hour TTL for fast responses
- **CORS Support**: Allows requests from browser extensions
- **Error Handling**: Graceful fallbacks for failed requests
- **Development Ready**: Easy setup for local development

## Setup

### Install Dependencies

```bash
cd og-backend
npm install
```

### Development

Start the development server with auto-reload:

```bash
npm run dev
```

The server will run on `http://localhost:3001`

### Production

Build and start:

```bash
npm run build
npm start
```

## API Endpoints

### GET /api/og

Fetch OpenGraph data for a URL.

**Parameters:**
- `url` (required): The URL to fetch metadata for

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Page Title",
    "description": "Page description",
    "image": "https://example.com/image.jpg",
    "domain": "example.com",
    "url": "https://example.com"
  },
  "cached": false
}
```

**Example:**
```
GET /api/og?url=https://github.com
```

### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "cacheSize": 42
}
```

### GET /api/cache/stats

Get cache statistics.

**Response:**
```json
{
  "totalEntries": 100,
  "validEntries": 85,
  "expiredEntries": 15
}
```

### DELETE /api/cache

Clear the cache.

**Response:**
```json
{
  "message": "Cache cleared successfully"
}
```

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3001)

### Cache Settings

- **TTL**: 1 hour (3600 seconds)
- **Storage**: In-memory (resets on server restart)

## Error Handling

The server handles various error conditions:

- Invalid URLs return 400 Bad Request
- Scraping failures return 500 Internal Server Error
- Network timeouts (10 second limit)
- Retry logic (2 attempts)

## CORS

The server is configured to allow cross-origin requests from browser extensions and localhost development.

## Testing

Test the API manually:

```bash
# Health check
curl http://localhost:3001/api/health

# Fetch OpenGraph data
curl "http://localhost:3001/api/og?url=https://github.com"

# Check cache stats
curl http://localhost:3001/api/cache/stats
```

## Integration with Tabli Extension

The Tabli extension includes an OpenGraph client (`ogClient.ts`) that:

- Connects to this backend server
- Provides client-side caching
- Handles fallbacks when the backend is unavailable
- Used by the TabPreview component for rich tab previews

The client automatically uses `http://localhost:3001` for development.