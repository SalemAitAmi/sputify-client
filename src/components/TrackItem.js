import AutoScrollText from './AutoScrollText';
import './ItemComponents.css';

const TrackItem = ({ track, index, showPlayedAt = false, playedAt = null }) => {
  if (!track) return null;

  const imageUrl = track.album?.images?.[2]?.url || track.album?.images?.[0]?.url;
  const artistName = track.artists?.[0]?.name || 'Unknown Artist';
  const spotifyUrl = track.external_urls?.spotify;

  return (
    <li className="item-row">
      <span className="item-index">{index}.</span>
      {imageUrl && (
        <img
          src={imageUrl}
          alt={track.name}
          className="item-image"
        />
      )}
      <div className="item-details">
        <AutoScrollText className="item-name">
          <a
            href={spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="item-link"
          >
            {track.name}
          </a>
        </AutoScrollText>
        <AutoScrollText className="item-subtitle">
          {artistName}
        </AutoScrollText>
      </div>
      {showPlayedAt && playedAt && (
        <span className="played-at">{playedAt}</span>
      )}
    </li>
  );
};

export default TrackItem;