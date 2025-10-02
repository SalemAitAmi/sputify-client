const CACHE_PREFIX = 'spotify_cache_';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const cacheManager = {
  // Get cached data if valid
  get: (key, maxAge = CACHE_DURATION) => {
    try {
      const cached = localStorage.getItem(CACHE_PREFIX + key);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      if (age > maxAge) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  // Set cached data with timestamp
  set: (key, data) => {
    try {
      const cached = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cached));
    } catch (error) {
      console.error('Cache set error:', error);
      // If quota exceeded, clear old caches
      if (error.name === 'QuotaExceededError') {
        cacheManager.clearOld();
        // Try again
        try {
          const cached = { data, timestamp: Date.now() };
          localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cached));
        } catch (retryError) {
          console.error('Cache set retry error:', retryError);
        }
      }
    }
  },

  // Get cache timestamp
  getTimestamp: (key) => {
    try {
      const cached = localStorage.getItem(CACHE_PREFIX + key);
      if (!cached) return null;
      const { timestamp } = JSON.parse(cached);
      return timestamp;
    } catch (error) {
      return null;
    }
  },

  // Clear specific cache
  clear: (key) => {
    localStorage.removeItem(CACHE_PREFIX + key);
  },

  // Clear all caches
  clearAll: () => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  },

  // Clear caches older than 24 hours
  clearOld: () => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          const { timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp > CACHE_DURATION) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          localStorage.removeItem(key);
        }
      }
    });
  },

  // Incremental update for saved tracks
  getLatestItem: (key) => {
    try {
      const cached = cacheManager.get(key);
      if (!cached || !cached.items || cached.items.length === 0) return null;
      return cached.items[0];
    } catch (error) {
      return null;
    }
  },

  // Merge new items with cached items
  mergeItems: (key, newItems, compareFn = (a, b) => a.added_at > b.added_at) => {
    try {
      const cached = cacheManager.get(key);
      if (!cached || !cached.items) {
        return { items: newItems, total: newItems.length };
      }

      // Remove duplicates and merge
      const existingIds = new Set(cached.items.map(item => 
        item.track?.id || item.album?.id || item.id
      ));
      
      const uniqueNewItems = newItems.filter(item => {
        const id = item.track?.id || item.album?.id || item.id;
        return !existingIds.has(id);
      });

      const merged = [...uniqueNewItems, ...cached.items];
      return { items: merged, total: merged.length };
    } catch (error) {
      console.error('Cache merge error:', error);
      return { items: newItems, total: newItems.length };
    }
  }
};

// Fetch with smart caching for saved tracks
export const fetchSavedTracksWithCache = async (
  fetchFn,
  key = 'saved_tracks',
  forceRefresh = false
) => {
  // Check cache first
  if (!forceRefresh) {
    const cached = cacheManager.get(key);
    const timestamp = cacheManager.getTimestamp(key);
    
    // If cache is fresh (less than 24 hours old), return it
    if (cached && timestamp && Date.now() - timestamp < CACHE_DURATION) {
      return cached;
    }

    // If cache exists but is old, do incremental update
    if (cached && cached.items && cached.items.length > 0) {
      try {
        const latestItem = cached.items[0];
        const latestDate = new Date(latestItem.added_at);
        
        // Fetch recent tracks to check for new additions
        const recent = await fetchFn(50, 0);
        const newItems = recent.items.filter(item => 
          new Date(item.added_at) > latestDate
        );

        if (newItems.length === 0) {
          // No new items, update timestamp and return cache
          cacheManager.set(key, cached);
          return cached;
        }

        // Merge new items with cache
        const merged = cacheManager.mergeItems(key, newItems);
        const result = {
          items: merged.items,
          total: recent.total // Use fresh total
        };
        
        cacheManager.set(key, result);
        return result;
      } catch (error) {
        console.error('Incremental update failed:', error);
        // Fall through to full refresh
      }
    }
  }

  // Full refresh - fetch all items with delay
  try {
    const allItems = [];
    let offset = 0;
    const limit = 50;
    let total = 0;

    // Get first batch to know total
    const first = await fetchFn(limit, 0);
    total = first.total;
    allItems.push(...first.items);
    offset += limit;

    // Fetch remaining batches with delay
    while (offset < total) {
      // Add 50ms delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const batch = await fetchFn(limit, offset);
      allItems.push(...batch.items);
      offset += limit;

      // Break if we got fewer items than requested
      if (batch.items.length < limit) break;
    }

    const result = { items: allItems, total };
    cacheManager.set(key, result);
    return result;
  } catch (error) {
    console.error('Full refresh failed:', error);
    // Return cached data if available
    const cached = cacheManager.get(key);
    if (cached) return cached;
    throw error;
  }
};