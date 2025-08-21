import { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import TrackItem from '../components/TrackItem';
import ArtistItem from '../components/ArtistItem';
import GenreItem from '../components/GenreItem';
import { useSpotify } from '../contexts/SpotifyContext';
import { calculateTopGenres } from '../utils/spotify';
import './Stats.css';

const Stats = () => {
  const { 
    user, 
    range, 
    fetchTopTracks, 
    fetchTopArtists,
    fetchUserPlaylists,
    fetchSavedTracks,
    fetchSavedAlbums,
    fetchFollowedArtists,
  } = useSpotify();

  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState({});
  const [fetchOffsets, setFetchOffsets] = useState({});
  const [fetchComplete, setFetchComplete] = useState({});
  const [displayCounts, setDisplayCounts] = useState({
    tracks: 20,
    artists: 20,
    genres: 20,
  });

  const HARD_LIMITS = {
    tracks: 50,
    artists: 50,
    genres: 50,
  };

  // Fetch Top Tracks
  const loadTopTracks = useCallback(async (append = false) => {
    if (loading.tracks) return;
    
    setLoading(prev => ({ ...prev, tracks: true }));
    const offset = append ? (fetchOffsets.tracks || 0) : 0;
    
    try {
      const response = await fetchTopTracks(50, offset);
      
      setMetrics(prev => ({
        ...prev,
        topTracks: append && prev.topTracks 
          ? [...prev.topTracks, ...response.items].slice(0, HARD_LIMITS.tracks)
          : response.items,
      }));
      
      setFetchOffsets(prev => ({
        ...prev,
        tracks: offset + response.items.length,
      }));
      
      if (response.items.length < 50 || offset + response.items.length >= HARD_LIMITS.tracks) {
        setFetchComplete(prev => ({ ...prev, tracks: true }));
      }
    } catch (error) {
      console.error('Error loading top tracks:', error);
    } finally {
      setLoading(prev => ({ ...prev, tracks: false }));
    }
  }, [fetchTopTracks, range, loading.tracks, fetchComplete.tracks, fetchOffsets.tracks]);

  // Fetch Top Artists
  const loadTopArtists = useCallback(async (append = false) => {
    if (loading.artists) return;
    
    setLoading(prev => ({ ...prev, artists: true }));
    const offset = append ? (fetchOffsets.artists || 0) : 0;
    
    try {
      const response = await fetchTopArtists(50, offset);
      
      setMetrics(prev => ({
        ...prev,
        topArtists: append && prev.topArtists 
          ? [...prev.topArtists, ...response.items].slice(0, HARD_LIMITS.artists)
          : response.items,
      }));
      
      setFetchOffsets(prev => ({
        ...prev,
        artists: offset + response.items.length,
      }));
      
      if (response.items.length < 50 || offset + response.items.length >= HARD_LIMITS.artists) {
        setFetchComplete(prev => ({ ...prev, artists: true }));
      }
    } catch (error) {
      console.error('Error loading top artists:', error);
    } finally {
      setLoading(prev => ({ ...prev, artists: false }));
    }
  }, [fetchTopArtists, range, loading.artists, fetchComplete.artists, fetchOffsets.artists]);

  // Fetch Top Genres
  const loadTopGenres = useCallback(async () => {
    if (loading.genres) return;
    
    setLoading(prev => ({ ...prev, genres: true }));
    
    try {
      const [tracks, artists] = await Promise.all([
        fetchTopTracks(50, 0),
        fetchTopArtists(50, 0),
      ]);
      
      const genres = calculateTopGenres(tracks.items, artists.items);
      setMetrics(prev => ({
        ...prev,
        topGenres: genres.slice(0, HARD_LIMITS.genres),
      }));
    } catch (error) {
      console.error('Error loading top genres:', error);
    } finally {
      setLoading(prev => ({ ...prev, genres: false }));
    }
  }, [fetchTopTracks, fetchTopArtists, range]);

  // Fetch User Stats
  const loadUserStats = useCallback(async () => {
    if (loading.stats) return;
    
    setLoading(prev => ({ ...prev, stats: true }));
    
    try {
      const [playlists, savedTracks, savedAlbums, followedArtists] = await Promise.all([
        fetchUserPlaylists(50, 0),
        fetchSavedTracks(1, 0),
        fetchSavedAlbums(1, 0),
        fetchFollowedArtists(1),
      ]);

      const stats = {
        playlistCount: playlists.total || 0,
        publicPlaylists: playlists.items?.filter(p => p.public).length || 0,
        collaborativePlaylists: playlists.items?.filter(p => p.collaborative).length || 0,
        savedSongs: savedTracks.total || 0,
        savedAlbums: savedAlbums.total || 0,
        followedArtists: followedArtists.artists?.total || 0,
        followerCount: user?.followers?.total || 0,
      };

      setMetrics(prev => ({ ...prev, userStats: stats }));
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  }, [user?.id, fetchUserPlaylists, fetchSavedTracks, fetchSavedAlbums, fetchFollowedArtists]);

  // Load more items
  const loadMoreTracks = useCallback(() => {
    setDisplayCounts(prev => ({
      ...prev,
      tracks: Math.min(prev.tracks + 10, HARD_LIMITS.tracks),
    }));

    if (metrics.topTracks?.length < displayCounts.tracks + 10) {
      loadTopTracks(true);
    }
  }, [displayCounts, loadTopTracks, metrics.topTracks]);

  const loadMoreArtists = useCallback(() => {
    setDisplayCounts(prev => ({
      ...prev,
      artists: Math.min(prev.artists + 10, HARD_LIMITS.artists),
    }));

    if (metrics.topArtists?.length < displayCounts.artists + 10) {
      loadTopArtists(true);
    }
  }, [displayCounts, loadTopArtists, metrics.topArtists]);

  const loadMoreGenres = useCallback(() => {
    setDisplayCounts(prev => ({
      ...prev,
      genres: Math.min(prev.genres + 10, HARD_LIMITS.genres),
    }));
  }, []);

  useEffect(() => {
    if (!user) return;
    setMetrics({});
    setFetchOffsets({});
    setFetchComplete({});
    setDisplayCounts({ tracks: 20, artists: 20, genres: 20 });
    setLoading({});

    setTimeout(() => loadTopTracks(), 0);
    setTimeout(() => loadTopArtists(), 0);
    setTimeout(() => loadTopGenres(), 50); // Give tracks and artists time to load
    setTimeout(() => loadUserStats(), 100);
    
  }, [range, user]);

  return (
    <div className="stats-page">
      <div className="page-header">
        <h2 className="page-title">Your Stats</h2>
        <p className="page-subtitle">Discover your listening patterns and preferences</p>
      </div>

      <div className="stats-layout">
        <div className="stats-main">
          <div className="stats-columns">
            {/* Top Tracks Column */}
            <div className="stats-column">
              <div className="column-header">
                <h3>Top Tracks</h3>
                {loading.tracks && <div className="loading-spinner small"></div>}
              </div>
              <div className="column-content">
                <ul className="stats-list">
                  {metrics.topTracks?.slice(0, displayCounts.tracks).map((track, i) => (
                    <TrackItem key={track.id} track={track} index={i + 1} />
                  ))}
                </ul>
                {displayCounts.tracks < (metrics.topTracks?.length || 0) && displayCounts.tracks < HARD_LIMITS.tracks && (
                  <button 
                    className="btn btn-ghost load-more-btn"
                    onClick={loadMoreTracks}
                    disabled={loading.tracks}
                  >
                    {loading.tracks ? 'Loading...' : 'Load More'}
                  </button>
                )}
              </div>
            </div>

            {/* Top Artists Column */}
            <div className="stats-column">
              <div className="column-header">
                <h3>Top Artists</h3>
                {loading.artists && <div className="loading-spinner small"></div>}
              </div>
              <div className="column-content">
                <ul className="stats-list">
                  {metrics.topArtists?.slice(0, displayCounts.artists).map((artist, i) => (
                    <ArtistItem key={artist.id} artist={artist} index={i + 1} />
                  ))}
                </ul>
                {displayCounts.artists < (metrics.topArtists?.length || 0) && displayCounts.artists < HARD_LIMITS.artists && (
                  <button 
                    className="btn btn-ghost load-more-btn"
                    onClick={loadMoreArtists}
                    disabled={loading.artists}
                  >
                    {loading.artists ? 'Loading...' : 'Load More'}
                  </button>
                )}
              </div>
            </div>

            {/* Top Genres Column */}
            <div className="stats-column">
              <div className="column-header">
                <h3>Top Genres</h3>
                {loading.genres && <div className="loading-spinner small"></div>}
              </div>
              <div className="column-content">
                <ul className="stats-list">
                  {metrics.topGenres?.slice(0, displayCounts.genres).map((genre, i) => (
                    <GenreItem key={genre.name} genre={genre} index={i + 1} />
                  ))}
                </ul>
                {displayCounts.genres < (metrics.topGenres?.length || 0) && displayCounts.genres < HARD_LIMITS.genres && (
                  <button 
                    className="btn btn-ghost load-more-btn"
                    onClick={loadMoreGenres}
                  >
                    Load More
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* General Stats Sidebar */}
        <div className="stats-sidebar">
          <div className="sidebar-header">
            <h3>General Stats</h3>
            {loading.stats && <div className="loading-spinner small"></div>}
          </div>
          <div className="sidebar-content">
            {renderUserStats()}
          </div>
        </div>
      </div>
    </div>
  );

  function renderUserStats() {
    const stats = metrics.userStats || {};
    return (
      <div className="general-stats">
        <div className="stat-item">
          <span className="stat-label">Playlists</span>
          <span className="stat-value">{stats.playlistCount || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Public Playlists</span>
          <span className="stat-value">{stats.publicPlaylists || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Collaborative</span>
          <span className="stat-value">{stats.collaborativePlaylists || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Saved Songs</span>
          <span className="stat-value">{stats.savedSongs || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Saved Albums</span>
          <span className="stat-value">{stats.savedAlbums || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Following</span>
          <span className="stat-value">{stats.followedArtists || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Followers</span>
          <span className="stat-value">{stats.followerCount || 0}</span>
        </div>
      </div>
    );
  }
};

export default Stats;