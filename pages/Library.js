import { useState, useEffect, useCallback } from 'react';
import TrackItem from '../components/TrackItem';
import ArtistItem from '../components/ArtistItem';
import AlbumItem from '../components/AlbumItem';
import PlaylistItem from '../components/PlaylistItem';
import ColumnSelector from '../components/ColumnSelector';
import { useSpotify } from '../contexts/SpotifyContext';
import { Heart, Users, Disc, ListMusic } from 'lucide-react';
import './Library.css';

const Library = () => {
  const { 
    fetchSavedTracks, 
    fetchSavedAlbums, 
    fetchFollowedArtists,
    fetchUserPlaylists 
  } = useSpotify();

  const [activeTab, setActiveTab] = useState('songs');
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState({});
  const [fetchOffsets, setFetchOffsets] = useState({});
  const [displayCounts, setDisplayCounts] = useState({
    songs: 20,
    albums: 20,
    artists: 20,
    playlists: 20,
  });

  const [columns, setColumns] = useState({
    songs: 1,
    albums: 3,
    artists: 3,
    playlists: 3,
  });

  // Load saved songs
  const loadSavedSongs = useCallback(async (append = false) => {
    if (loading.songs) return;
    
    setLoading(prev => ({ ...prev, songs: true }));
    const offset = append ? (fetchOffsets.songs || 0) : 0;
    
    try {
      const response = await fetchSavedTracks(50, offset);
      
      setMetrics(prev => ({
        ...prev,
        savedSongs: append && prev.savedSongs 
          ? [...prev.savedSongs, ...response.items]
          : response.items,
        totalSongs: response.total,
      }));
      
      setFetchOffsets(prev => ({
        ...prev,
        songs: offset + response.items.length,
      }));
    } catch (error) {
      console.error('Error loading saved songs:', error);
    } finally {
      setLoading(prev => ({ ...prev, songs: false }));
    }
  }, [fetchSavedTracks, loading.songs, fetchOffsets.songs]);

  // Load saved albums
  const loadSavedAlbums = useCallback(async (append = false) => {
    if (loading.albums) return;
    
    setLoading(prev => ({ ...prev, albums: true }));
    const offset = append ? (fetchOffsets.albums || 0) : 0;
    
    try {
      const response = await fetchSavedAlbums(50, offset);
      
      setMetrics(prev => ({
        ...prev,
        savedAlbums: append && prev.savedAlbums 
          ? [...prev.savedAlbums, ...response.items]
          : response.items,
        totalAlbums: response.total,
      }));
      
      setFetchOffsets(prev => ({
        ...prev,
        albums: offset + response.items.length,
      }));
    } catch (error) {
      console.error('Error loading saved albums:', error);
    } finally {
      setLoading(prev => ({ ...prev, albums: false }));
    }
  }, [fetchSavedAlbums, loading.albums, fetchOffsets.albums]);

  // Load followed artists
  const loadFollowedArtists = useCallback(async (append = false) => {
    if (loading.artists) return;
    
    setLoading(prev => ({ ...prev, artists: true }));
    const after = append ? metrics.lastArtistId : null;
    
    try {
      const response = await fetchFollowedArtists(50, after);
      
      const artists = response.artists.items;
      const lastId = artists[artists.length - 1]?.id;
      
      setMetrics(prev => ({
        ...prev,
        followedArtists: append && prev.followedArtists 
          ? [...prev.followedArtists, ...artists]
          : artists,
        totalArtists: response.artists.total,
        lastArtistId: lastId,
      }));
    } catch (error) {
      console.error('Error loading followed artists:', error);
    } finally {
      setLoading(prev => ({ ...prev, artists: false }));
    }
  }, [fetchFollowedArtists, loading.artists, metrics.lastArtistId]);

  // Load user playlists
  const loadPlaylists = useCallback(async (append = false) => {
    if (loading.playlists) return;
    
    setLoading(prev => ({ ...prev, playlists: true }));
    const offset = append ? (fetchOffsets.playlists || 0) : 0;
    
    try {
      const response = await fetchUserPlaylists(50, offset);
      
      setMetrics(prev => ({
        ...prev,
        playlists: append && prev.playlists 
          ? [...prev.playlists, ...response.items]
          : response.items,
        totalPlaylists: response.total,
      }));
      
      setFetchOffsets(prev => ({
        ...prev,
        playlists: offset + response.items.length,
      }));
    } catch (error) {
      console.error('Error loading playlists:', error);
    } finally {
      setLoading(prev => ({ ...prev, playlists: false }));
    }
  }, [fetchUserPlaylists, loading.playlists, fetchOffsets.playlists]);

  // Load more items
  const loadMore = useCallback((type) => {
    setDisplayCounts(prev => ({
      ...prev,
      [type]: prev[type] + 20,
    }));

    // Trigger fetch if needed
    if (type === 'songs' && (!metrics.savedSongs || displayCounts.songs >= metrics.savedSongs.length)) {
      loadSavedSongs(true);
    } else if (type === 'albums' && (!metrics.savedAlbums || displayCounts.albums >= metrics.savedAlbums.length)) {
      loadSavedAlbums(true);
    } else if (type === 'artists' && (!metrics.followedArtists || displayCounts.artists >= metrics.followedArtists.length)) {
      loadFollowedArtists(true);
    } else if (type === 'playlists' && (!metrics.playlists || displayCounts.playlists >= metrics.playlists.length)) {
      loadPlaylists(true);
    }
  }, [displayCounts, metrics, loadSavedSongs, loadSavedAlbums, loadFollowedArtists, loadPlaylists]);

  // Initial load for all tabs to get counts
  useEffect(() => {
    loadSavedSongs();
    loadSavedAlbums();
    loadFollowedArtists();
    loadPlaylists();
  }, []); // Only run once on mount

  const tabs = [
    { id: 'songs', label: 'Saved Songs', icon: Heart, count: metrics.totalSongs || 0 },
    { id: 'albums', label: 'Albums', icon: Disc, count: metrics.totalAlbums || 0 },
    { id: 'artists', label: 'Following', icon: Users, count: metrics.totalArtists || 0 },
    { id: 'playlists', label: 'Playlists', icon: ListMusic, count: metrics.totalPlaylists || 0 },
  ];

  return (
    <div className="library-page">
      <div className="page-header">
        <h2 className="page-title">Your Library</h2>
        <p className="page-subtitle">All your saved music in one place</p>
      </div>

      <div className="tabs-container">
        <div className="tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
              {tab.count > 0 && <span className="tab-count">{tab.count}</span>}
            </button>
          ))}
        </div>
        <ColumnSelector 
          columns={columns[activeTab]}
          onChange={(newColumns) => setColumns(prev => ({ ...prev, [activeTab]: newColumns }))}
        />
      </div>

      <div className="tab-content">
        {loading[activeTab] && !metrics[activeTab === 'songs' ? 'savedSongs' : 
                                    activeTab === 'albums' ? 'savedAlbums' :
                                    activeTab === 'artists' ? 'followedArtists' : 
                                    'playlists'] ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your {activeTab}...</p>
          </div>
        ) : (
          <>
            {activeTab === 'songs' && renderSongs()}
            {activeTab === 'albums' && renderAlbums()}
            {activeTab === 'artists' && renderArtists()}
            {activeTab === 'playlists' && renderPlaylists()}
          </>
        )}
      </div>
    </div>
  );

  function renderSongs() {
    const songs = metrics.savedSongs?.slice(0, displayCounts.songs) || [];
    
    return (
      <div className="songs-container" style={{ '--columns': columns.songs }}>
        <ul className="item-grid">
          {songs.map((item, index) => (
            <TrackItem 
              key={item.track.id} 
              track={item.track} 
              index={index + 1}
              showPlayedAt={true}
              playedAt={new Date(item.added_at).toLocaleDateString()}
            />
          ))}
        </ul>
        {songs.length < metrics.totalSongs && (
          <button 
            className="btn btn-secondary load-more"
            onClick={() => loadMore('songs')}
            disabled={loading.songs}
          >
            {loading.songs ? 'Loading...' : 'Load More'}
          </button>
        )}
      </div>
    );
  }

  function renderAlbums() {
    const albums = metrics.savedAlbums?.slice(0, displayCounts.albums) || [];
    
    return (
      <div className="albums-container" style={{ '--columns': columns.albums }}>
        <div className="item-grid">
          {albums.map((item, index) => (
            <div key={item.album.id} className="recent-item-card">
              <AlbumItem album={item.album} index={index + 1} />
              <div className="save-info">
                <span className="saved-date">Added {new Date(item.added_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
        {albums.length > 0 && albums.length < metrics.totalAlbums && (
          <button 
            className="btn btn-secondary load-more"
            onClick={() => loadMore('albums')}
            disabled={loading.albums}
          >
            {loading.albums ? 'Loading...' : 'Load More'}
          </button>
        )}
      </div>
    );
  }

  function renderArtists() {
    const artists = metrics.followedArtists?.slice(0, displayCounts.artists) || [];
    
    return (
      <div className="artists-container" style={{ '--columns': columns.artists }}>
        <div className="item-grid">
          {artists.map((artist, index) => (
            <div key={artist.id} className="recent-item-card">
              <ArtistItem artist={artist} index={index + 1} />
            </div>
          ))}
        </div>
        {artists.length > 0 && artists.length < metrics.totalArtists && (
          <button 
            className="btn btn-secondary load-more"
            onClick={() => loadMore('artists')}
            disabled={loading.artists}
          >
            {loading.artists ? 'Loading...' : 'Load More'}
          </button>
        )}
      </div>
    );
  }

  function renderPlaylists() {
    const playlists = metrics.playlists?.slice(0, displayCounts.playlists) || [];
    
    return (
      <div className="playlists-container" style={{ '--columns': columns.playlists }}>
        <ul className="item-grid">
          {playlists.map((playlist, index) => (
            <PlaylistItem key={playlist.id} playlist={playlist} index={index + 1} />
          ))}
        </ul>
        {playlists.length > 0 && playlists.length < metrics.totalPlaylists && (
          <button 
            className="btn btn-secondary load-more"
            onClick={() => loadMore('playlists')}
            disabled={loading.playlists}
          >
            {loading.playlists ? 'Loading...' : 'Load More'}
          </button>
        )}
      </div>
    );
  }
};

export default Library;