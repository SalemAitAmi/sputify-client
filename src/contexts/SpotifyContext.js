import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import SpotifyWebApi from 'spotify-web-api-js';
import { useAuth } from './AuthContext';
import { refreshToken } from '../utils/auth';
import { cacheManager } from '../utils/cache';

const SpotifyContext = createContext(null);
const spotifyApi = new SpotifyWebApi();

export const SpotifyProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState('long_term');
  const [metrics, setMetrics] = useState({});

  // Token management
  const [tokens, setTokens] = useState(() => {
    const stored = localStorage.getItem('spotifyTokens');
    return stored ? JSON.parse(stored) : { accessToken: '', refreshToken: '', expiresAt: 0 };
  });

  // Check if token is valid
  const isTokenValid = useCallback(() => {
    if (!tokens.accessToken || !tokens.expiresAt) return false;
    return tokens.expiresAt - Date.now() > 5 * 60 * 1000;
  }, [tokens]);

  // Store tokens
  const storeTokens = useCallback((accessToken, refreshTokenValue, expiresIn) => {
    const newTokens = {
      accessToken,
      refreshToken: refreshTokenValue || tokens.refreshToken,
      expiresAt: Date.now() + expiresIn * 1000,
    };
    setTokens(newTokens);
    localStorage.setItem('spotifyTokens', JSON.stringify(newTokens));
    spotifyApi.setAccessToken(accessToken);
  }, [tokens.refreshToken]);

  // Refresh access token
  const refreshAccessToken = useCallback(async () => {
    if (!tokens.refreshToken) {
      setError('No refresh token available');
      return false;
    }

    try {
      const response = await refreshToken();
      if (response.access_token) {
        storeTokens(response.access_token, tokens.refreshToken, response.expires_in || 3600);
        setError('');
        return true;
      }
    } catch (err) {
      console.error('Failed to refresh token:', err);
      setError('Session expired. Please log in again.');
      localStorage.removeItem('spotifyTokens');
      window.location.href = window.location.origin + window.location.pathname + '#/';
      return false;
    }
  }, [tokens.refreshToken, storeTokens]);

  // Auto refresh token check
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const checkAndRefresh = async () => {
      if (!isTokenValid()) {
        await refreshAccessToken();
      }
    };

    checkAndRefresh();
    const interval = setInterval(checkAndRefresh, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [isTokenValid, refreshAccessToken, isAuthenticated]);

  // Initialize Spotify API
  useEffect(() => {
    const stored = localStorage.getItem('spotifyTokens');
    if (stored) {
      try {
        const parsedTokens = JSON.parse(stored);
        setTokens(parsedTokens);
        if (parsedTokens.accessToken) {
          spotifyApi.setAccessToken(parsedTokens.accessToken);
        }
      } catch (error) {
        console.error('Error parsing stored tokens:', error);
      }
    }
  }, [isAuthenticated]);

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    if (!tokens.accessToken) return;
    
    setLoading(true);
    try {
      const userData = await spotifyApi.getMe();
      setUser(userData);
      setError('');
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      if (err.status === 401) {
        const success = await refreshAccessToken();
        if (success) {
          try {
            const userData = await spotifyApi.getMe();
            setUser(userData);
            setError('');
          } catch (retryErr) {
            setError('Failed to fetch user data: ' + retryErr.message);
          }
        }
      } else {
        setError('Failed to fetch user data: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [tokens.accessToken, refreshAccessToken]);

  // API call wrapper
  const makeApiCall = useCallback(async (apiMethod, ...args) => {
    try {
      return await apiMethod(...args);
    } catch (err) {
      if (err.status === 401) {
        const success = await refreshAccessToken();
        if (success) {
          return await apiMethod(...args);
        }
      }
      throw err;
    }
  }, [refreshAccessToken]);

  // Fetch top tracks with caching
  const fetchTopTracks = useCallback(async (limit = 50, offset = 0) => {
    const cacheKey = `top_tracks_${range}_${limit}_${offset}`;
    const cached = cacheManager.get(cacheKey, 10 * 60 * 1000); // 10 min cache
    
    if (cached) return cached;

    try {
      const response = await makeApiCall(
        spotifyApi.getMyTopTracks.bind(spotifyApi),
        { time_range: range, limit, offset }
      );
      cacheManager.set(cacheKey, response);
      return response;
    } catch (err) {
      setError('Failed to fetch top tracks: ' + err.message);
      throw err;
    }
  }, [range, makeApiCall]);

  // Fetch top artists with caching
  const fetchTopArtists = useCallback(async (limit = 50, offset = 0) => {
    const cacheKey = `top_artists_${range}_${limit}_${offset}`;
    const cached = cacheManager.get(cacheKey, 10 * 60 * 1000);
    
    if (cached) return cached;

    try {
      const response = await makeApiCall(
        spotifyApi.getMyTopArtists.bind(spotifyApi),
        { time_range: range, limit, offset }
      );
      cacheManager.set(cacheKey, response);
      return response;
    } catch (err) {
      setError('Failed to fetch top artists: ' + err.message);
      throw err;
    }
  }, [range, makeApiCall]);

  // Fetch multiple artists by IDs
  const fetchArtistsByIds = useCallback(async (artistIds) => {
    if (!artistIds || artistIds.length === 0) return { artists: [] };
    
    try {
      const batches = [];
      for (let i = 0; i < artistIds.length; i += 50) {
        const batch = artistIds.slice(i, i + 50);
        batches.push(batch);
      }
      
      const results = await Promise.all(
        batches.map(batch => 
          makeApiCall(
            spotifyApi.getArtists.bind(spotifyApi),
            batch
          ).catch(err => {
            console.error('Error fetching artist batch:', err);
            return { artists: [] };
          })
        )
      );
      
      const allArtists = results.flatMap(r => r.artists || []);
      return { artists: allArtists };
    } catch (err) {
      setError('Failed to fetch artists: ' + err.message);
      throw err;
    }
  }, [makeApiCall]);

  // Fetch recently played with caching
  const fetchRecentlyPlayed = useCallback(async (limit = 50) => {
    const cacheKey = `recently_played_${limit}`;
    const cached = cacheManager.get(cacheKey, 2 * 60 * 1000); // 2 min cache
    
    if (cached) return cached;

    try {
      const response = await makeApiCall(
        spotifyApi.getMyRecentlyPlayedTracks.bind(spotifyApi),
        { limit }
      );
      cacheManager.set(cacheKey, response);
      return response;
    } catch (err) {
      setError('Failed to fetch recently played: ' + err.message);
      throw err;
    }
  }, [makeApiCall]);

  // Fetch saved albums
  const fetchSavedAlbums = useCallback(async (limit = 50, offset = 0) => {
    try {
      const response = await makeApiCall(
        spotifyApi.getMySavedAlbums.bind(spotifyApi),
        { limit, offset }
      );
      return response;
    } catch (err) {
      setError('Failed to fetch saved albums: ' + err.message);
      throw err;
    }
  }, [makeApiCall]);

  // Fetch saved tracks
  const fetchSavedTracks = useCallback(async (limit = 50, offset = 0) => {
    try {
      const response = await makeApiCall(
        spotifyApi.getMySavedTracks.bind(spotifyApi),
        { limit, offset }
      );
      return response;
    } catch (err) {
      setError('Failed to fetch saved tracks: ' + err.message);
      throw err;
    }
  }, [makeApiCall]);

  // Fetch followed artists
  const fetchFollowedArtists = useCallback(async (limit = 50, after = null) => {
    try {
      const params = { limit, type: 'artist' };
      if (after) params.after = after;
      const response = await makeApiCall(
        spotifyApi.getFollowedArtists.bind(spotifyApi),
        params
      );
      return response;
    } catch (err) {
      setError('Failed to fetch followed artists: ' + err.message);
      throw err;
    }
  }, [makeApiCall]);

  // Fetch user playlists
  const fetchUserPlaylists = useCallback(async (limit = 50, offset = 0) => {
    try {
      const response = await makeApiCall(
        spotifyApi.getUserPlaylists.bind(spotifyApi),
        { limit, offset }
      );
      return response;
    } catch (err) {
      setError('Failed to fetch playlists: ' + err.message);
      throw err;
    }
  }, [makeApiCall]);

  // Initialize user data on auth change
  useEffect(() => {
    if (isAuthenticated && tokens.accessToken) {
      fetchUserData();
    }
  }, [isAuthenticated, tokens.accessToken, fetchUserData]);

  // Clear metrics cache when range changes
  useEffect(() => {
    setMetrics({});
  }, [range]);

  // Clear old caches on mount
  useEffect(() => {
    cacheManager.clearOld();
  }, []);

  const value = {
    user,
    loading,
    error,
    range,
    setRange,
    metrics,
    setMetrics,
    spotifyApi,
    fetchUserData,
    fetchTopTracks,
    fetchTopArtists,
    fetchArtistsByIds,
    fetchRecentlyPlayed,
    fetchSavedAlbums,
    fetchSavedTracks,
    fetchFollowedArtists,
    fetchUserPlaylists,
    refreshAccessToken,
    isTokenValid,
  };

  return (
    <SpotifyContext.Provider value={value}>
      {children}
    </SpotifyContext.Provider>
  );
};

export const useSpotify = () => {
  const context = useContext(SpotifyContext);
  if (!context) {
    throw new Error('useSpotify must be used within a SpotifyProvider');
  }
  return context;
};