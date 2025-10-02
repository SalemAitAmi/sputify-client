import { useState, useEffect, useCallback } from 'react';
import TrackItem from '../components/TrackItem';
import ArtistItem from '../components/ArtistItem';
import AlbumItem from '../components/AlbumItem';
import ColumnSelector from '../components/ColumnSelector';
import { useSpotify } from '../contexts/SpotifyContext';
import { extractUniqueFromRecentlyPlayed, formatDate } from '../utils/spotify';
import { Clock, Music, Users, Disc } from 'lucide-react';
import './RecentlyPlayed.css';

const RecentlyPlayed = () => {
  const { fetchRecentlyPlayed } = useSpotify();
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tracks');
  const [displayCounts, setDisplayCounts] = useState({
    tracks: 20,
    artists: 20,
    albums: 20,
    podcasts: 20,
  });

  const [columns, setColumns] = useState(() => {
    const isMobile = window.innerWidth <= 768;
    return {
      tracks: 1,
      artists: isMobile ? 1 : 3,
      albums: isMobile ? 1 : 3,
      podcasts: isMobile ? 1 : 3,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768;
      setColumns(prev => ({
        tracks: 1,
        artists: prev.artists === 1 && !isMobile ? 3 : isMobile ? 1 : prev.artists,
        albums: prev.albums === 1 && !isMobile ? 3 : isMobile ? 1 : prev.albums,
        podcasts: prev.podcasts === 1 && !isMobile ? 3 : isMobile ? 1 : prev.podcasts,
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadRecentlyPlayed = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchRecentlyPlayed(50);
      const extracted = extractUniqueFromRecentlyPlayed(response.items);
      
      const artistIds = extracted.artists.slice(0, 50).map(a => a.id).filter(Boolean);
      let fullArtists = extracted.artists;
      
      if (artistIds.length > 0) {
        try {
          const artistsResponse = await fetch(`https://api.spotify.com/v1/artists?ids=${artistIds.join(',')}`, {
            headers: {
              'Authorization': `Bearer ${JSON.parse(localStorage.getItem('spotifyTokens')).accessToken}`
            }
          });
          
          if (artistsResponse.ok) {
            const artistsData = await artistsResponse.json();
            fullArtists = extracted.artists.map(extractedArtist => {
              const fullArtist = artistsData.artists.find(a => a.id === extractedArtist.id);
              return fullArtist ? { ...fullArtist, playCount: extractedArtist.playCount, lastPlayed: extractedArtist.lastPlayed } : extractedArtist;
            });
          }
        } catch (artistError) {
          console.warn('Failed to fetch full artist details:', artistError);
        }
      }
      
      setMetrics({
        recentTracks: response.items,
        recentArtists: fullArtists,
        recentAlbums: extracted.albums,
        recentPodcasts: extracted.podcasts,
      });
    } catch (error) {
      console.error('Error loading recently played:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchRecentlyPlayed]);

  const loadMore = useCallback((type) => {
    setDisplayCounts(prev => ({
      ...prev,
      [type]: prev[type] + 20,
    }));
  }, []);

  useEffect(() => {
    loadRecentlyPlayed();
    const interval = setInterval(loadRecentlyPlayed, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadRecentlyPlayed]);

  const tabs = [
    { id: 'tracks', label: 'Tracks', icon: Music, count: metrics.recentTracks?.length || 0 },
    { id: 'artists', label: 'Artists', icon: Users, count: metrics.recentArtists?.length || 0 },
    { id: 'albums', label: 'Albums', icon: Disc, count: metrics.recentAlbums?.length || 0 },
  ];

  if (metrics.recentPodcasts?.length > 0) {
    tabs.push({ 
      id: 'podcasts', 
      label: 'Podcasts', 
      icon: Clock, 
      count: metrics.recentPodcasts.length 
    });
  }

  return (
    <div className="recently-played-page">
      <div className="page-header">
        <h2 className="page-title">Recently Played</h2>
        <p className="page-subtitle">Your listening history from the past few days</p>
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
              <span className="tab-count">{tab.count}</span>
            </button>
          ))}
        </div>
        <ColumnSelector 
          columns={columns[activeTab]}
          onChange={(newColumns) => setColumns(prev => ({ ...prev, [activeTab]: newColumns }))}
        />
      </div>

      <div className="tab-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your recent history...</p>
          </div>
        ) : (
          <>
            {activeTab === 'tracks' && renderTracks()}
            {activeTab === 'artists' && renderArtists()}
            {activeTab === 'albums' && renderAlbums()}
            {activeTab === 'podcasts' && renderPodcasts()}
          </>
        )}
      </div>
    </div>
  );

  function renderTracks() {
    const tracks = metrics.recentTracks?.slice(0, displayCounts.tracks) || [];
    
    return (
      <div className="tracks-container" style={{ '--columns': columns.tracks }}>
        <ul className="item-grid">
          {tracks.map((item, index) => (
            <TrackItem 
              key={`${item.track.id}-${item.played_at}`} 
              track={item.track} 
              index={index + 1}
              showPlayedAt={true}
              playedAt={formatDate(item.played_at)}
            />
          ))}
        </ul>
        {tracks.length < metrics.recentTracks?.length && (
          <button 
            className="btn btn-secondary load-more"
            onClick={() => loadMore('tracks')}
          >
            Load More
          </button>
        )}
      </div>
    );
  }

  function renderArtists() {
    const artists = metrics.recentArtists?.slice(0, displayCounts.artists) || [];
    
    return (
      <div className="artists-container" style={{ '--columns': columns.artists }}>
        <div className="item-grid">
          {artists.map((artist, index) => (
            <div key={artist.id} className="recent-item-card">
              <ArtistItem artist={artist} index={index + 1} />
              <div className="play-info">
                <span className="play-count">{artist.playCount} play{artist.playCount !== 1 ? 's' : ''}</span>
                <span className="last-played">Last: {formatDate(artist.lastPlayed)}</span>
              </div>
            </div>
          ))}
        </div>
        {artists.length < metrics.recentArtists?.length && (
          <button 
            className="btn btn-secondary load-more"
            onClick={() => loadMore('artists')}
          >
            Load More
          </button>
        )}
      </div>
    );
  }

  function renderAlbums() {
    const albums = metrics.recentAlbums?.slice(0, displayCounts.albums) || [];
    
    return (
      <div className="albums-container" style={{ '--columns': columns.albums }}>
        <div className="item-grid">
          {albums.map((album, index) => (
            <div key={album.id} className="recent-item-card">
              <AlbumItem album={album} index={index + 1} />
              <div className="play-info">
                <span className="play-count">{album.playCount} play{album.playCount !== 1 ? 's' : ''}</span>
                <span className="last-played">Last: {formatDate(album.lastPlayed)}</span>
              </div>
            </div>
          ))}
        </div>
        {albums.length < metrics.recentAlbums?.length && (
          <button 
            className="btn btn-secondary load-more"
            onClick={() => loadMore('albums')}
          >
            Load More
          </button>
        )}
      </div>
    );
  }

  function renderPodcasts() {
    const podcasts = metrics.recentPodcasts?.slice(0, displayCounts.podcasts) || [];
    
    if (podcasts.length === 0) {
      return (
        <div className="empty-state">
          <p>No podcasts in your recent history</p>
        </div>
      );
    }
    
    return (
      <div className="podcasts-container" style={{ '--columns': columns.podcasts }}>
        <div className="item-grid">
          {podcasts.map((podcast, index) => (
            <div key={podcast.id} className="recent-item-card">
              <div className="podcast-item">
                <span className="item-index">{index + 1}.</span>
                <img 
                  src={podcast.images?.[0]?.url} 
                  alt={podcast.name}
                  className="podcast-image"
                />
                <div className="podcast-details">
                  <h4>{podcast.name}</h4>
                  <p>{podcast.publisher}</p>
                </div>
              </div>
              <div className="play-info">
                <span className="play-count">{podcast.playCount} episode{podcast.playCount !== 1 ? 's' : ''}</span>
                <span className="last-played">Last: {formatDate(podcast.lastPlayed)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
};

export default RecentlyPlayed;