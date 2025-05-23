// Mock API for TabPreview - provides sample images and descriptions
export interface PreviewData {
    image?: string;
    description?: string;
    domain: string;
}

// Sample data pool for mock responses
const mockData: Record<string, PreviewData> = {
    'github.com': {
        image: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
        description: 'GitHub is where the world builds software. Millions of developers and companies build, ship, and maintain their software on GitHub.',
        domain: 'github.com'
    },
    'stackoverflow.com': {
        image: 'https://cdn.sstatic.net/Sites/stackoverflow/Img/apple-touch-icon@2.png',
        description: 'Stack Overflow is the largest, most trusted online community for developers to learn, share​ ​their programming ​knowledge, and build their careers.',
        domain: 'stackoverflow.com'
    },
    'youtube.com': {
        image: 'https://www.youtube.com/img/desktop/yt_1200.png',
        description: 'Enjoy the videos and music you love, upload original content, and share it all with friends, family, and the world on YouTube.',
        domain: 'youtube.com'
    },
    'reddit.com': {
        image: 'https://www.redditstatic.com/desktop2x/img/favicon/android-icon-192x192.png',
        description: 'Reddit is a network of communities where people can dive into their interests, hobbies and passions.',
        domain: 'reddit.com'
    },
    'twitter.com': {
        image: 'https://abs.twimg.com/responsive-web/client-web/icon-ios.b1fc7276.png',
        description: 'From breaking news and entertainment to sports and politics, get the full story with all the live commentary.',
        domain: 'twitter.com'
    },
    'medium.com': {
        image: 'https://miro.medium.com/max/1400/1*psYl0y9DUzZWtHzFJP2uYQ.png',
        description: 'Medium is an open platform where readers find dynamic thinking, and where expert and undiscovered voices can share their writing.',
        domain: 'medium.com'
    },
    'news.ycombinator.com': {
        image: 'https://news.ycombinator.com/favicon.ico',
        description: 'Hacker News is a social news website focusing on computer science and entrepreneurship.',
        domain: 'news.ycombinator.com'
    },
    'default': {
        image: 'https://via.placeholder.com/200x150/4A90E2/ffffff?text=Web+Page',
        description: 'This is a sample web page description that would typically come from OpenGraph metadata.',
        domain: 'example.com'
    }
};

// Extract domain from URL
function extractDomain(url: string): string {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch {
        return 'unknown';
    }
}

// Mock API function
export async function fetchPreviewData(url: string): Promise<PreviewData> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
    
    const domain = extractDomain(url);
    
    // Check if we have specific mock data for this domain
    const mockEntry = mockData[domain] || mockData['default'];
    
    return {
        ...mockEntry,
        domain: domain
    };
}