/**
 * Image Search Service
 * Multi-tier image search for artist photos
 * Priority: Wikipedia → Unsplash → Pexels → Placeholder
 */

export interface ImageSearchResult {
    url: string;
    source: 'wikipedia' | 'unsplash' | 'pexels' | 'placeholder';
    attribution?: string;
}

export class ImageSearchService {
    private unsplashAccessKey: string;
    private pexelsApiKey: string;

    constructor() {
        this.unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY || '';
        this.pexelsApiKey = process.env.PEXELS_API_KEY || '';
    }

    /**
     * Find artist image using multi-tier search
     */
    async findArtistImage(artistName: string): Promise<ImageSearchResult> {
        console.log(`🔍 Searching image for: ${artistName}`);

        // Tier 1: Wikipedia (Free, Unlimited, Most Authentic)
        const wikiResult = await this.searchWikipedia(artistName);
        if (wikiResult) {
            console.log(`✅ Found on Wikipedia: ${artistName}`);
            return wikiResult;
        }

        // Tier 2: Unsplash (Free, 50 req/hour)
        if (this.unsplashAccessKey) {
            const unsplashResult = await this.searchUnsplash(artistName);
            if (unsplashResult) {
                console.log(`✅ Found on Unsplash: ${artistName}`);
                return unsplashResult;
            }
        }

        // Tier 3: Pexels (Free, 200 req/hour)
        if (this.pexelsApiKey) {
            const pexelsResult = await this.searchPexels(artistName);
            if (pexelsResult) {
                console.log(`✅ Found on Pexels: ${artistName}`);
                return pexelsResult;
            }
        }

        // Fallback: Placeholder
        console.log(`⚠️  No image found, using placeholder for: ${artistName}`);
        return this.getPlaceholder();
    }

    /**
     * Search Wikipedia for artist image
     */
    private async searchWikipedia(artistName: string): Promise<ImageSearchResult | null> {
        try {
            const encodedName = encodeURIComponent(artistName);
            const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedName}`;

            const response = await fetch(url);
            if (!response.ok) return null;

            const data = await response.json();

            // Check if there's a thumbnail image
            if (data.thumbnail?.source) {
                return {
                    url: data.thumbnail.source,
                    source: 'wikipedia',
                    attribution: `Wikipedia - ${data.title}`,
                };
            }

            // Check for original image
            if (data.originalimage?.source) {
                return {
                    url: data.originalimage.source,
                    source: 'wikipedia',
                    attribution: `Wikipedia - ${data.title}`,
                };
            }

            return null;
        } catch (error) {
            console.warn(`Wikipedia search failed for ${artistName}:`, error);
            return null;
        }
    }

    /**
     * Search Unsplash for artist image
     */
    private async searchUnsplash(artistName: string): Promise<ImageSearchResult | null> {
        if (!this.unsplashAccessKey) return null;

        try {
            const encodedQuery = encodeURIComponent(`${artistName} kpop artist portrait`);
            const url = `https://api.unsplash.com/search/photos?query=${encodedQuery}&per_page=1&orientation=portrait`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Client-ID ${this.unsplashAccessKey}`,
                },
            });

            if (!response.ok) return null;

            const data = await response.json();

            if (data.results && data.results.length > 0) {
                const photo = data.results[0];
                return {
                    url: photo.urls.regular,
                    source: 'unsplash',
                    attribution: `Photo by ${photo.user.name} on Unsplash`,
                };
            }

            return null;
        } catch (error) {
            console.warn(`Unsplash search failed for ${artistName}:`, error);
            return null;
        }
    }

    /**
     * Search Pexels for artist image
     */
    private async searchPexels(artistName: string): Promise<ImageSearchResult | null> {
        if (!this.pexelsApiKey) return null;

        try {
            const encodedQuery = encodeURIComponent(`${artistName} kpop artist`);
            const url = `https://api.pexels.com/v1/search?query=${encodedQuery}&per_page=1&orientation=portrait`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': this.pexelsApiKey,
                },
            });

            if (!response.ok) return null;

            const data = await response.json();

            if (data.photos && data.photos.length > 0) {
                const photo = data.photos[0];
                return {
                    url: photo.src.large,
                    source: 'pexels',
                    attribution: `Photo by ${photo.photographer} on Pexels`,
                };
            }

            return null;
        } catch (error) {
            console.warn(`Pexels search failed for ${artistName}:`, error);
            return null;
        }
    }

    /**
     * Get placeholder image
     */
    private getPlaceholder(): ImageSearchResult {
        // Generic K-pop placeholder from a reliable source
        return {
            url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=600&fit=crop',
            source: 'placeholder',
            attribution: 'Generic K-pop placeholder',
        };
    }
}
