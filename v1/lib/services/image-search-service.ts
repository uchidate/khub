/**
 * Image Search Service
 * Multi-tier image search for artist photos
 * Priority: Wikipedia → Unsplash → Pexels → Placeholder
 */

export interface ImageSearchResult {
    url: string;
    source: 'wikipedia' | 'unsplash' | 'pexels' | 'placeholder' | 'tmdb' | 'google';
    attribution?: string;
}

export class ImageSearchService {
    private unsplashAccessKey: string;
    private pexelsApiKey: string;

    constructor() {
        this.unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY || '';
        this.pexelsApiKey = process.env.PEXELS_API_KEY || '';
        console.log('ImageSearchService initialized.');
        console.log('Keys available:');
        console.log('- Unsplash:', !!this.unsplashAccessKey);
        console.log('- Google Key:', !!process.env.GOOGLE_CUSTOM_SEARCH_KEY);
        console.log('- Google CX:', !!process.env.GOOGLE_CX);
        console.log('- TMDB:', !!process.env.TMDB_API_KEY);
    }

    /**
     * Find artist image using multi-tier search
     */
    async findArtistImage(artistName: string, alternatives: string[] = []): Promise<ImageSearchResult | null> {
        console.log(`🔍 Searching image for: ${artistName} (alternatives: ${alternatives.join(', ')})`)

        const queries = [artistName, ...alternatives];

        // Tier 1: TMDB (Best for Actors/Double Threats) - Iterating aliases
        if (process.env.TMDB_API_KEY) {
            for (const query of queries) {
                const tmdbResult = await this.searchTMDB(query);
                if (tmdbResult) {
                    console.log(`✅ Found on TMDB: ${query}`);
                    return tmdbResult;
                }
            }
        }

        // Tier 2: Wikipedia (Free, Authentic)
        for (const query of queries) {
            const wikiResult = await this.searchWikipedia(query);
            if (wikiResult) {
                console.log(`✅ Found on Wikipedia: ${query}`);
                return wikiResult;
            }
        }

        // Tier 3: Unsplash (High Quality, Fallback) - Only check main name (avoid random matches on aliases)
        if (process.env.UNSPLASH_ACCESS_KEY) {
            const unsplashResult = await this.searchUnsplash(artistName);
            if (unsplashResult) {
                console.log(`✅ Found on Unsplash: ${artistName}`);
                return unsplashResult;
            }
        }

        // Tier 4: Google Custom Search (The Ultimate Fallback)
        if (process.env.GOOGLE_CUSTOM_SEARCH_KEY && process.env.GOOGLE_CX) {
            for (const query of queries) {
                const googleResult = await this.searchGoogle(query);
                if (googleResult) {
                    console.log(`✅ Found on Google: ${query}`);
                    return googleResult;
                }
            }
        }

        // Tier 5: Pexels (Last Resort)
        if (process.env.PEXELS_API_KEY) {
            const pexelsResult = await this.searchPexels(artistName);
            if (pexelsResult) {
                console.log(`✅ Found on Pexels: ${artistName}`);
                return pexelsResult;
            }
        }

        console.log(`⚠️  No image found, using placeholder for: ${artistName}`)
        return this.getPlaceholder()
    }

    /**
     * Find production poster using TMDB movie/TV search
     */
    async findProductionImage(titlePt: string, titleKr: string | null, type: string): Promise<ImageSearchResult | null> {
        const queries = titleKr ? [titleKr, titlePt] : [titlePt];

        // Tier 1: TMDB (purpose-built for movie/TV posters)
        if (process.env.TMDB_API_KEY) {
            for (const query of queries) {
                const result = await this.searchTMDBProduction(query, type);
                if (result) {
                    console.log(`✅ Found production poster on TMDB: ${query}`);
                    return result;
                }
            }
        }

        // Tier 2: Google Custom Search
        if (process.env.GOOGLE_CUSTOM_SEARCH_KEY && process.env.GOOGLE_CX) {
            for (const query of queries) {
                const result = await this.searchGoogleProduction(query);
                if (result) {
                    console.log(`✅ Found production poster on Google: ${query}`);
                    return result;
                }
            }
        }

        console.log(`⚠️  No poster found for: ${titlePt}`);
        return null;
    }

    /**
     * Search TMDB for movie or TV show poster
     */
    private async searchTMDBProduction(query: string, type: string): Promise<ImageSearchResult | null> {
        try {
            const primaryEndpoint = type.toLowerCase() === 'serie' ? 'tv' : 'movie';
            const endpoints = [primaryEndpoint, primaryEndpoint === 'tv' ? 'movie' : 'tv'];

            for (const endpoint of endpoints) {
                const searchUrl = `https://api.themoviedb.org/3/search/${endpoint}?query=${encodeURIComponent(query)}&include_adult=false&page=1`;

                const response = await fetch(searchUrl, {
                    headers: {
                        accept: 'application/json',
                        Authorization: `Bearer ${process.env.TMDB_API_KEY}`
                    }
                });
                if (!response.ok) continue;

                const data = await response.json();
                const result = data.results?.[0];

                if (result?.poster_path) {
                    return {
                        url: `https://image.tmdb.org/t/p/original${result.poster_path}`,
                        source: 'tmdb',
                        attribution: 'The Movie Database (TMDB)'
                    };
                }
            }
            return null;
        } catch (error) {
            console.error('TMDB Production Search Error:', error);
            return null;
        }
    }

    /**
     * Search Google for production poster
     */
    private async searchGoogleProduction(query: string): Promise<ImageSearchResult | null> {
        try {
            const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_KEY;
            const cx = process.env.GOOGLE_CX;
            const q = `${query} korean drama movie poster`;

            const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(q)}&searchType=image&num=1&fileType=jpg&imgSize=large`;

            const response = await fetch(url);
            if (!response.ok) return null;

            const data = await response.json();
            const item = data.items?.[0];

            if (item && item.link) {
                return {
                    url: item.link,
                    source: 'google',
                    attribution: 'Google Search'
                };
            }
            return null;
        } catch (error) {
            console.error('Google Production Search Error:', error);
            return null;
        }
    }

    /**
     * Search TMDB for Person
     */
    private async searchTMDB(query: string): Promise<ImageSearchResult | null> {
        try {
            const searchUrl = `https://api.themoviedb.org/3/search/person?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`;
            const options = {
                method: 'GET',
                headers: {
                    accept: 'application/json',
                    Authorization: `Bearer ${process.env.TMDB_API_KEY}`
                }
            };

            const response = await fetch(searchUrl, options);
            if (!response.ok) return null;

            const data = await response.json();
            const person = data.results?.[0]; // Best match

            if (person && person.profile_path) {
                // Check popularity or known_for to ensure it's K-related? hard to say. 
                // But usually name match is decent.
                return {
                    url: `https://image.tmdb.org/t/p/original${person.profile_path}`,
                    source: 'tmdb',
                    attribution: 'The Movie Database (TMDB)'
                };
            }
            return null;
        } catch (error) {
            console.error('TMDB Search Error:', error);
            return null;
        }
    }

    /**
     * Search Google Custom Search
     */
    private async searchGoogle(query: string): Promise<ImageSearchResult | null> {
        try {
            const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_KEY; // Or user's provided key
            const cx = process.env.GOOGLE_CX;
            const q = `${query} kpop official profile`; // Refine query

            const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(q)}&searchType=image&num=1&fileType=jpg&imgSize=large`;

            const response = await fetch(url);
            if (!response.ok) {
                console.warn(`⚠️ Google Search Failed: ${response.status} ${response.statusText}`);
                const errText = await response.text();
                console.warn(`   Response: ${errText}`);
                return null;
            }

            const data = await response.json();
            console.log(`   Google Results: ${data.items?.length || 0} items`);
            const item = data.items?.[0];

            if (item && item.link) {
                return {
                    url: item.link,
                    source: 'google',
                    attribution: 'Google Search'
                };
            }
            return null;
        } catch (error) {
            console.error('Google Search Error:', error);
            return null;
        }
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
        const placeholders = [
            'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=600&fit=crop', // Default
            'https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=400&h=600&fit=crop', // Neon vibes
            'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&h=600&fit=crop', // Man in blur
            'https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?w=400&h=600&fit=crop', // Stage lights
            'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=400&h=600&fit=crop', // Party/Stage
            'https://images.unsplash.com/photo-1459749411177-046f52bbace9?w=400&h=600&fit=crop', // Concert
            'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=600&fit=crop', // Event
            'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&h=600&fit=crop', // Crowd
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=600&fit=crop', // Microphone
            'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&h=600&fit=crop', // Piano/Mood
        ];

        const randomUrl = placeholders[Math.floor(Math.random() * placeholders.length)];

        return {
            url: randomUrl,
            source: 'placeholder',
            attribution: 'Generic K-pop placeholder',
        };
    }
}
