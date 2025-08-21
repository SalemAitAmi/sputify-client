import { Lock, Users, Music } from 'lucide-react';
import AutoScrollText from './AutoScrollText';
import { decodeHtmlEntities } from '../utils/spotify';
import './ItemComponents.css';
import './PlaylistItem.css';

const PlaylistItem = ({ playlist, index }) => {
  if (!playlist) return null;

  const imageUrl = playlist.images?.[0]?.url;
  const spotifyUrl = playlist.external_urls?.spotify;
  const isPublic = playlist.public;
  const isCollaborative = playlist.collaborative;
  const trackCount = playlist.tracks?.total || 0;

  return (
    <li className="item-row playlist-row">
      {index && <span className="item-index">{index}.</span>}
      <div className="playlist-cover">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={playlist.name}
            className="item-image"
          />
        ) : (
          <div className="playlist-image-placeholder">
            <Music size={20} />
          </div>
        )}
      </div>
      <div className="item-details">
        <AutoScrollText className="item-name">
          <a
            href={spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="item-link"
          >
            {playlist.name}
          </a>
        </AutoScrollText>
        {playlist.description && (
          <AutoScrollText className="item-subtitle">
            {decodeHtmlEntities(playlist.description)}
          </AutoScrollText>
        )}
        <div className="playlist-meta">
          <span className="track-count">{trackCount} tracks</span>
          {isCollaborative && (
            <span className="playlist-badge collaborative">
              <Users size={12} /> Collaborative
            </span>
          )}
          {!isPublic && (
            <span className="playlist-badge private">
              <Lock size={12} /> Private
            </span>
          )}
        </div>
      </div>
    </li>
  );
};

export default PlaylistItem;