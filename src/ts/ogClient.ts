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

export interface OpenGraphClient {
    fetchOpenGraphData(url: string): Promise<OpenGraphData>;
    getCacheStats?(): { size: number; validEntries: number };
    clearCache?(): void;
    isBackendAvailable?(): Promise<boolean>;
}

class OpenGraphRemoteClient implements OpenGraphClient {
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

class OpenGraphLocalClient implements OpenGraphClient {
    private cache = new Map<string, CacheEntry>();
    private readonly cacheTTL = 1000 * 60 * 60; // 1 hour

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

    // Parse OpenGraph metadata from HTML content
    private parseOpenGraphFromHTML(html: string, url: string): OpenGraphData {
        // Create a temporary DOM parser
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Extract OpenGraph meta tags
        const ogTags = doc.querySelectorAll('meta[property^="og:"]');
        const twitterTags = doc.querySelectorAll('meta[name^="twitter:"]');
        
        let title: string | undefined;
        let description: string | undefined;
        let image: string | undefined;
        
        // Extract OpenGraph data
        ogTags.forEach(tag => {
            const property = tag.getAttribute('property');
            const content = tag.getAttribute('content');
            
            if (!property || !content) return;
            
            switch (property) {
                case 'og:title':
                    title = content;
                    break;
                case 'og:description':
                    description = content;
                    break;
                case 'og:image':
                    image = content;
                    break;
            }
        });
        
        // Fallback to Twitter cards if OpenGraph not found
        if (!title || !description || !image) {
            twitterTags.forEach(tag => {
                const name = tag.getAttribute('name');
                const content = tag.getAttribute('content');
                
                if (!name || !content) return;
                
                switch (name) {
                    case 'twitter:title':
                        if (!title) title = content;
                        break;
                    case 'twitter:description':
                        if (!description) description = content;
                        break;
                    case 'twitter:image':
                        if (!image) image = content;
                        break;
                }
            });
        }
        
        // Fallback to basic HTML tags
        if (!title) {
            const titleTag = doc.querySelector('title');
            if (titleTag) title = titleTag.textContent || undefined;
        }
        
        if (!description) {
            const metaDesc = doc.querySelector('meta[name="description"]');
            if (metaDesc) description = metaDesc.getAttribute('content') || undefined;
        }
        
        // Make image URL absolute if it's relative
        if (image && !image.startsWith('http')) {
            try {
                const baseUrl = new URL(url);
                image = new URL(image, baseUrl.origin).href;
            } catch {
                // If URL parsing fails, ignore the image
                image = undefined;
            }
        }
        
        return {
            title,
            description,
            image,
            domain: this.extractDomain(url),
            url
        };
    }

    // Fetch OpenGraph data using Chrome extension APIs
    async fetchOpenGraphData(url: string): Promise<OpenGraphData> {
        // Check cache first
        const cachedData = this.getCachedData(url);
        if (cachedData) {
            console.log(`OpenGraph cache hit for: ${url}`);
            return cachedData;
        }

        console.log(`Fetching OpenGraph data locally for: ${url}`);

        try {
            // Find the tab with this URL
            const tabs = await chrome.tabs.query({ url });
            
            if (tabs.length === 0) {
                throw new Error('Tab not found');
            }
            
            const tab = tabs[0];
            const tabId = tab.id;
            
            if (!tabId) {
                throw new Error('Invalid tab ID');
            }
            
            // Execute script to get page HTML
            const results = await chrome.scripting.executeScript({
                target: { tabId },
                func: () => document.documentElement.outerHTML
            });
            
            if (!results || !results[0] || !results[0].result) {
                throw new Error('Failed to get page content');
            }
            
            const html = results[0].result;
            const openGraphData = this.parseOpenGraphFromHTML(html, url);
            
            // Cache the result
            this.setCachedData(url, openGraphData);
            
            return openGraphData;
            
        } catch (error) {
            console.error('OpenGraph local fetch error:', error);
            
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
        console.log('OpenGraph local cache cleared');
    }
}

// Create singleton instances
const ogRemoteClient = new OpenGraphRemoteClient();
const ogLocalClient = new OpenGraphLocalClient();

// Function to get the appropriate client based on preferences
export function getOpenGraphClient(enableTabPreviews: boolean): OpenGraphClient {
    return enableTabPreviews ? ogLocalClient : ogRemoteClient;
}

// Export the client instances and classes
export { ogRemoteClient, ogLocalClient, OpenGraphRemoteClient, OpenGraphLocalClient };
export default ogRemoteClient;