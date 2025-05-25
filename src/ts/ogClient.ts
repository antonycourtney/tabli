// OpenGraph client for browser extension with caching

export interface OpenGraphData {
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

interface CacheEntry {
    data: OpenGraphData;
    timestamp: number;
}

class OpenGraphClient {
    private cache = new Map<string, CacheEntry>();
    private readonly cacheTTL = 1000 * 60 * 60; // 1 hour
    private readonly baseUrl: string;

    constructor(baseUrl: string = 'http://localhost:3001') {
        this.baseUrl = baseUrl;
    }

    // Check if cached data is still valid
    private getCachedData(url: string): OpenGraphData | null {
        const cached = this.cache.get(url);
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.data;
        }
        if (cached) {
            this.cache.delete(url); // Remove expired entry
        }
        return null;
    }

    // Store data in cache
    private setCachedData(url: string, data: OpenGraphData): void {
        this.cache.set(url, {
            data,
            timestamp: Date.now()
        });
    }

    // Extract domain from URL
    private extractDomain(url: string): string {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '');
        } catch {
            return 'unknown';
        }
    }

    // Fetch OpenGraph data with caching
    async fetchOpenGraphData(url: string): Promise<OpenGraphData> {
        // Check cache first
        const cachedData = this.getCachedData(url);
        if (cachedData) {
            console.log(`OpenGraph cache hit for: ${url}`);
            return cachedData;
        }

        console.log(`Fetching OpenGraph data from backend for: ${url}`);

        try {
            const encodedUrl = encodeURIComponent(url);
            const response = await fetch(`${this.baseUrl}/api/og?url=${encodedUrl}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result: OpenGraphResponse = await response.json();

            if (!result.success || !result.data) {
                throw new Error(result.error || 'Failed to fetch OpenGraph data');
            }

            // Cache the successful result
            this.setCachedData(url, result.data);
            
            return result.data;

        } catch (error) {
            console.error('OpenGraph fetch error:', error);
            
            // Return fallback data
            const fallbackData: OpenGraphData = {
                title: undefined,
                description: 'Unable to load preview for this page',
                image: undefined,
                domain: this.extractDomain(url),
                url: url
            };

            return fallbackData;
        }
    }

    // Get cache statistics
    getCacheStats(): { size: number; validEntries: number } {
        const now = Date.now();
        const validEntries = Array.from(this.cache.values()).filter(
            entry => now - entry.timestamp < this.cacheTTL
        ).length;

        return {
            size: this.cache.size,
            validEntries: validEntries
        };
    }

    // Clear cache
    clearCache(): void {
        this.cache.clear();
        console.log('OpenGraph cache cleared');
    }

    // Check if backend is available
    async isBackendAvailable(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/health`, {
                method: 'GET',
                timeout: 5000
            } as RequestInit);
            return response.ok;
        } catch {
            return false;
        }
    }
}

// Create singleton instance
const ogClient = new OpenGraphClient();

// Export the client instance and interface
export { ogClient, OpenGraphClient };
export default ogClient;