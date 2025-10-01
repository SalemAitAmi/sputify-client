// Calculate top genres based on simple count with proper ranking
export const calculateTopGenres = (tracks = [], artists = [], additionalArtists = []) => {
  const genreData = new Map();
  
  // Combine top artists with additional fetched artists
  const allArtists = [...artists, ...additionalArtists];
  const artistMap = new Map(allArtists.map(a => [a.id, a]));
  
  // Count genres from all artists
  allArtists.forEach(artist => {
    if (artist.genres && Array.isArray(artist.genres)) {
      artist.genres.forEach(genre => {
        if (!genreData.has(genre)) {
          genreData.set(genre, {
            name: genre,
            fromTracks: new Set(),
            fromArtists: new Set()
          });
        }
        const data = genreData.get(genre);
        data.fromArtists.add(artist.id);
      });
    }
  });
  
  // Process tracks to associate them with genres through their artists
  tracks.forEach(track => {
    if (track.artists && Array.isArray(track.artists)) {
      track.artists.forEach(trackArtist => {
        // Find the full artist data
        const fullArtist = artistMap.get(trackArtist.id);
        if (fullArtist && fullArtist.genres) {
          fullArtist.genres.forEach(genre => {
            const data = genreData.get(genre);
            if (data) {
              data.fromTracks.add(track.id);
            }
          });
        }
      });
    }
  });
  
  // Convert to array and calculate final metrics
  const genreArray = Array.from(genreData.values())
    .map(data => {
      const trackCount = data.fromTracks.size;
      const artistCount = data.fromArtists.size;
      // Calculate a composite score for ranking
      // Weight tracks slightly higher as they represent actual listening
      const score = (trackCount * 1.5) + artistCount;
      return {
        name: data.name,
        trackCount,
        artistCount,
        score
      };
    })
    .sort((a, b) => {
      // Sort by score, then by track count, then by artist count
      if (b.score !== a.score) return b.score - a.score;
      if (b.trackCount !== a.trackCount) return b.trackCount - a.trackCount;
      return b.artistCount - a.artistCount;
    });
  
  return genreArray;
};

// Decode HTML entities
export const decodeHtmlEntities = (text) => {
  if (!text) return '';
  
  const parser = new DOMParser();
  const decodedString = parser.parseFromString(text, 'text/html').documentElement.textContent;
  return decodedString || text;
};

// Format duration from milliseconds
export const formatDuration = (ms) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Format date
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  
  return date.toLocaleDateString();
};

// Group items by property
export const groupBy = (items, key) => {
  return items.reduce((groups, item) => {
    const group = item[key];
    if (!groups[group]) groups[group] = [];
    groups[group].push(item);
    return groups;
  }, {});
};

// Extract unique items from recently played
export const extractUniqueFromRecentlyPlayed = (items = []) => {
  const artists = new Map();
  const albums = new Map();
  const podcasts = new Map();
  
  items.forEach(item => {
    const track = item.track;
    
    // Extract artists
    track.artists?.forEach(artist => {
      if (!artists.has(artist.id)) {
        artists.set(artist.id, {
          ...artist,
          playCount: 1,
          lastPlayed: item.played_at
        });
      } else {
        const existing = artists.get(artist.id);
        existing.playCount++;
        if (item.played_at > existing.lastPlayed) {
          existing.lastPlayed = item.played_at;
        }
      }
    });
    
    // Extract albums
    if (track.album && !albums.has(track.album.id)) {
      albums.set(track.album.id, {
        ...track.album,
        playCount: 1,
        lastPlayed: item.played_at
      });
    } else if (track.album) {
      const existing = albums.get(track.album.id);
      existing.playCount++;
      if (item.played_at > existing.lastPlayed) {
        existing.lastPlayed = item.played_at;
      }
    }
    
    // Extract podcasts (if track type is episode)
    if (track.type === 'episode' && track.show) {
      if (!podcasts.has(track.show.id)) {
        podcasts.set(track.show.id, {
          ...track.show,
          playCount: 1,
          lastPlayed: item.played_at
        });
      } else {
        const existing = podcasts.get(track.show.id);
        existing.playCount++;
        if (item.played_at > existing.lastPlayed) {
          existing.lastPlayed = item.played_at;
        }
      }
    }
  });
  
  return {
    artists: Array.from(artists.values()).sort((a, b) => b.playCount - a.playCount),
    albums: Array.from(albums.values()).sort((a, b) => b.playCount - a.playCount),
    podcasts: Array.from(podcasts.values()).sort((a, b) => b.playCount - a.playCount),
  };
};