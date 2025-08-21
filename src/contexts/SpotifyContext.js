import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import SpotifyWebApi from 'spotify-web-api-js';
import { useAuth } from './AuthContext';
import { refreshToken } from '../services/auth';

const SpotifyContext = createContext(null);
const spotifyApi = new SpotifyWebApi();

export const SpotifyProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState('long_term');
  const [metrics, setMetrics] = useState({});
  const [fetchedMetrics, setFetchedMetrics] = useState(new Set());

  // Token management
  const [tokens, setTokens] = useState(() => {
    const stored = localStorage.getItem('spotifyTokens');
    return stored ? JSON.parse(stored) : { accessToken: '', refreshToken: '', expiresAt: 0 };
  });

  // Check if token is valid
  const isTokenValid = useCallback(() => {
    if (!tokens.accessToken || !tokens.expiresAt) return false;
    return tokens.expiresAt > Date.now();
  }, [tokens]);

  // Check if token needs refresh
  const needsRefresh = useCallback(() => {
    if (!tokens.accessToken || !tokens.expiresAt) return true;
    return tokens.expiresAt - Date.now() <= 10 * 60 * 1000; // Less than 10 minutes
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
      return;
    }

    try {
      const response = await refreshToken(tokens.refreshToken);
      if (response.access_token) {
        storeTokens(response.access_token, tokens.refreshToken, response.expires_in || 3600);
        return true;
      }
    } catch (err) {
      setError('Failed to refresh token: ' + err.message);
      return false;
    }
  }, [tokens.refreshToken, storeTokens]);

  // Auto refresh token
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const checkAndRefresh = async () => {
      if (needsRefresh()) {
        await refreshAccessToken();
      }
    };

    checkAndRefresh();
    const interval = setInterval(checkAndRefresh, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(interval);
  }, [needsRefresh, refreshAccessToken, isAuthenticated]);

  // Initialize Spotify API
  useEffect(() => {
    if (tokens.accessToken && isTokenValid()) {
      spotifyApi.setAccessToken(tokens.accessToken);
    }
  }, [tokens.accessToken, isTokenValid]);

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    if (!isTokenValid()) return;
    
    setLoading(true);
    try {
      const userData = await spotifyApi.getMe();
      setUser(userData);
      setError('');
    } catch (err) {
      setError('Failed to fetch user data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [isTokenValid]);

  // Fetch top tracks
  const fetchTopTracks = useCallback(async (limit = 50, offset = 0) => {
    try {
      const response = await spotifyApi.getMyTopTracks({
        time_range: range,
        limit,
        offset,
      });
      return response;
    } catch (err) {
      setError('Failed to fetch top tracks: ' + err.message);
      throw err;
    }
  }, [range]);

  // Fetch top artists
  const fetchTopArtists = useCallback(async (limit = 50, offset = 0) => {
    try {
      const response = await spotifyApi.getMyTopArtists({
        time_range: range,
        limit,
        offset,
      });
      return response;
    } catch (err) {
      setError('Failed to fetch top artists: ' + err.message);
      throw err;
    }
  }, [range]);

  // Fetch recently played
  const fetchRecentlyPlayed = useCallback(async (limit = 50) => {
    try {
      const response = await spotifyApi.getMyRecentlyPlayedTracks({ limit });
      return response;
    } catch (err) {
      setError('Failed to fetch recently played: ' + err.message);
      throw err;
    }
  }, []);

  // Fetch saved albums
  const fetchSavedAlbums = useCallback(async (limit = 50, offset = 0) => {
    try {
      const response = await spotifyApi.getMySavedAlbums({ limit, offset });
      return response;
    } catch (err) {
      setError('Failed to fetch saved albums: ' + err.message);
      throw err;
    }
  }, []);

  // Fetch saved tracks
  const fetchSavedTracks = useCallback(async (limit = 50, offset = 0) => {
    try {
      const response = await spotifyApi.getMySavedTracks({ limit, offset });
      return response;
    } catch (err) {
      setError('Failed to fetch saved tracks: ' + err.message);
      throw err;
    }
  }, []);

  // Fetch followed artists
  const fetchFollowedArtists = useCallback(async (limit = 50, after = null) => {
    try {
      const params = { limit, type: 'artist' };
      if (after) params.after = after;
      const response = await spotifyApi.getFollowedArtists(params);
      return response;
    } catch (err) {
      setError('Failed to fetch followed artists: ' + err.message);
      throw err;
    }
  }, []);

  // Fetch user playlists
  const fetchUserPlaylists = useCallback(async (limit = 50, offset = 0) => {
    try {
      const response = await spotifyApi.getUserPlaylists({ limit, offset });
      return response;
    } catch (err) {
      setError('Failed to fetch playlists: ' + err.message);
      throw err;
    }
  }, []);

  // Initialize user data on auth change
  useEffect(() => {
    if (isAuthenticated && isTokenValid()) {
      fetchUserData();
    }
  }, [isAuthenticated, isTokenValid, fetchUserData]);

  // Clear metrics when range changes to force refetch
  useEffect(() => {
    setMetrics({});
    setFetchedMetrics(new Set());
  }, [range]);

  const value = {
    user,
    loading,
    error,
    range,
    setRange,
    metrics,
    setMetrics,
    fetchedMetrics,
    setFetchedMetrics,
    spotifyApi,
    // API methods
    fetchUserData,
    fetchTopTracks,
    fetchTopArtists,
    fetchRecentlyPlayed,
    fetchSavedAlbums,
    fetchSavedTracks,
    fetchFollowedArtists,
    fetchUserPlaylists,
    // Token methods
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