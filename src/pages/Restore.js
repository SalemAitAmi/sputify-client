import { useState, useCallback, useEffect } from 'react';
import { useSpotify } from '../contexts/SpotifyContext';
import TrackItem from '../components/TrackItem';
import MetricCard from '../components/MetricCard';
import { Search, AlertCircle, CheckCircle } from 'lucide-react';
import './Restore.css';

const Restore = () => {
  const { fetchSavedTracks } = useSpotify();
  const [market, setMarket] = useState('US');
  const [isScanning, setIsScanning] = useState(false);
  const [unavailableTracks, setUnavailableTracks] = useState([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [isComplete, setIsComplete] = useState(false);

  // Get user's market from geolocation
  useEffect(() => {
    const getUserMarket = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          const data = await response.json();
          if (data.country_code) {
            setMarket(data.country_code);
          }
        }
      } catch (error) {
        console.log('Could not determine location, using default US market');
      }
    };
    getUserMarket();
  }, []);

  const scanLibrary = useCallback(async () => {
    setIsScanning(true);
    setUnavailableTracks([]);
    setProgress({ current: 0, total: 0 });
    setIsComplete(false);

    try {
      // Get total count first
      const initial = await fetchSavedTracks(1, 0);
      const total = initial.total;
      setProgress({ current: 0, total });

      const unavailable = [];
      const limit = 50;
      let offset = 0;

      // Fetch tracks with market parameter
      const spotifyApi = new (await import('spotify-web-api-js')).default();
      const tokens = JSON.parse(localStorage.getItem('spotifyTokens'));
      spotifyApi.setAccessToken(tokens.accessToken);

      while (offset < total) {
        try {
          // Add delay to avoid rate limiting (100ms between requests)
          if (offset > 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          const response = await spotifyApi.getMySavedTracks({
            limit,
            offset,
            market: market
          });

          // Check each track for availability
          response.items.forEach((item, index) => {
            const track = item.track;
            // Track is unavailable if is_playable is explicitly false
            if (track.is_playable === false) {
              unavailable.push({
                ...item,
                foundAt: offset + index + 1
              });
            }
          });

          offset += response.items.length;
          setProgress({ current: offset, total });

          // Update UI with found tracks
          setUnavailableTracks([...unavailable]);

          // Break if we've reached the end
          if (response.items.length < limit) break;

        } catch (error) {
          console.error('Error fetching batch:', error);
          // Continue to next batch even if one fails
        }
      }

      setIsComplete(true);
    } catch (error) {
      console.error('Error scanning library:', error);
    } finally {
      setIsScanning(false);
    }
  }, [fetchSavedTracks, market]);

  return (
    <div className="restore-page">
      <div className="page-header">
        <h2 className="page-title">Restore Unavailable Songs</h2>
        <p className="page-subtitle">
          Find songs in your library that are unavailable in your region
        </p>
      </div>

      <div className="restore-controls">
        <div className="market-selector">
          <label htmlFor="market">Market:</label>
          <select
            id="market"
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            disabled={isScanning}
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="AU">Australia</option>
            <option value="BR">Brazil</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
            <option value="IT">Italy</option>
            <option value="ES">Spain</option>
            <option value="MX">Mexico</option>
            <option value="JP">Japan</option>
            <option value="KR">South Korea</option>
            <option value="IN">India</option>
          </select>
        </div>

        <button
          className="btn btn-primary scan-button"
          onClick={scanLibrary}
          disabled={isScanning}
        >
          <Search size={20} />
          {isScanning ? 'Scanning...' : 'Start Scan'}
        </button>
      </div>

      {isScanning && (
        <div className="scan-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${(progress.current / progress.total) * 100}%`
              }}
            />
          </div>
          <p className="progress-text">
            Scanned {progress.current} of {progress.total} songs
          </p>
        </div>
      )}

      {isComplete && (
        <div className="scan-complete">
          {unavailableTracks.length === 0 ? (
            <div className="empty-state">
              <CheckCircle size={48} color="var(--spotify-green)" />
              <h3>No Unavailable Songs in Library</h3>
              <p>All your saved songs are available in {market}</p>
            </div>
          ) : (
            <div className="results-header">
              <AlertCircle size={24} color="var(--spotify-green)" />
              <h3>
                Found {unavailableTracks.length} unavailable song
                {unavailableTracks.length !== 1 ? 's' : ''}
              </h3>
            </div>
          )}
        </div>
      )}

      {unavailableTracks.length > 0 && (
        <MetricCard
          id="unavailable-songs"
          title={`Unavailable Songs (${unavailableTracks.length})`}
          isLoading={false}
        >
          <ul className="unavailable-list">
            {unavailableTracks.map((item) => (
              <TrackItem
                key={`${item.track.id}-${item.foundAt}`}
                track={item.track}
                index={item.foundAt}
                showPlayedAt={true}
                playedAt={`Added ${new Date(item.added_at).toLocaleDateString()}`}
              />
            ))}
          </ul>
        </MetricCard>
      )}
    </div>
  );
};

export default Restore;