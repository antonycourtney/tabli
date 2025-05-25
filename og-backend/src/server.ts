import express from 'express';
import cors from 'cors';
import ogs from 'open-graph-scraper';

interface OpenGraphData {
    title?: string;
    description?: string;
    image?: string;
    domain: string;
    url: string;
}

interface OpenGraphResponse {
    success: boolean;
    data?: OpenGraphData;
    error?: string;
    cached?: boolean;
}

const app = express();
const PORT = process.env.PORT || 3001;

// In-memory cache for development
const cache = new Map<string, { data: OpenGraphData; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// Middleware
app.use(cors());
app.use(express.json());

// Extract domain from URL
function extractDomain(url: string): string {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch {
        return 'unknown';
    }
}

// Check cache
function getCachedData(url: string): OpenGraphData | null {
    const cached = cache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    if (cached) {
        cache.delete(url); // Remove expired entry
    }
    return null;
}

// Store in cache
function setCachedData(url: string, data: OpenGraphData): void {
    cache.set(url, { data, timestamp: Date.now() });
}

// OpenGraph endpoint
app.get('/api/og', async (req, res) => {
    const url = req.query.url as string;
    
    if (!url) {
        return res.status(400).json({
            success: false,
            error: 'URL parameter is required'
        } as OpenGraphResponse);
    }

    // Validate URL
    try {
        new URL(url);
    } catch {
        return res.status(400).json({
            success: false,
            error: 'Invalid URL format'
        } as OpenGraphResponse);
    }

    // Check cache first
    const cachedData = getCachedData(url);
    if (cachedData) {
        return res.json({
            success: true,
            data: cachedData,
            cached: true
        } as OpenGraphResponse);
    }

    try {
        console.log(`Fetching OpenGraph data for: ${url}`);
        
        const options = {
            url: url,
            timeout: 10000, // 10 second timeout
            retry: 2,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Tabli-OG-Bot/1.0)'
            }
        };

        const result = await ogs(options);
        
        if (result.error) {
            console.error('OpenGraph scraping error:', result.error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch OpenGraph data'
            } as OpenGraphResponse);
        }

        const ogData = result.result;
        const domain = extractDomain(url);

        const responseData: OpenGraphData = {
            title: ogData.ogTitle || ogData.twitterTitle || ogData.dcTitle,
            description: ogData.ogDescription || ogData.twitterDescription || ogData.dcDescription,
            image: ogData.ogImage?.[0]?.url || ogData.twitterImage?.[0]?.url,
            domain: domain,
            url: url
        };

        // Cache the result
        setCachedData(url, responseData);

        res.json({
            success: true,
            data: responseData,
            cached: false
        } as OpenGraphResponse);

    } catch (error) {
        console.error('Error fetching OpenGraph data:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        } as OpenGraphResponse);
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        cacheSize: cache.size 
    });
});

// Cache stats endpoint
app.get('/api/cache/stats', (req, res) => {
    const now = Date.now();
    const validEntries = Array.from(cache.values()).filter(
        entry => now - entry.timestamp < CACHE_TTL
    ).length;
    
    res.json({
        totalEntries: cache.size,
        validEntries: validEntries,
        expiredEntries: cache.size - validEntries
    });
});

// Clear cache endpoint
app.delete('/api/cache', (req, res) => {
    cache.clear();
    res.json({ message: 'Cache cleared successfully' });
});

app.listen(PORT, () => {
    console.log(`OpenGraph backend server running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`Cache stats: http://localhost:${PORT}/api/cache/stats`);
});

export default app;