import AutoScrollText from './AutoScrollText';
import './ItemComponents.css';

const AlbumItem = ({ album, index, showArtist = true }) => {
  if (!album) return null;

  const imageUrl = album.images?.[2]?.url || album.images?.[0]?.url;
  const spotifyUrl = album.external_urls?.spotify;
  const artistNames = album.artists?.map(a => a.name).join(', ');
  const releaseYear = album.release_date?.split('-')[0];

  return (
    <li className="item-row">
      {index && <span className="item-index">{index}.</span>}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={album.name}
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
            {album.name}
          </a>
        </AutoScrollText>
        {showArtist && artistNames && (
          <AutoScrollText className="item-subtitle">
            {artistNames} {releaseYear && `• ${releaseYear}`}
          </AutoScrollText>
        )}
      </div>
    </li>
  );
};

export default AlbumItem;