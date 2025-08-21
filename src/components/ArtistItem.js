import AutoScrollText from './AutoScrollText';
import './ItemComponents.css';

const ArtistItem = ({ artist, index }) => {
  if (!artist) return null;

  const imageUrl = artist.images?.[2]?.url || artist.images?.[0]?.url;
  const spotifyUrl = artist.external_urls?.spotify;
  const genres = artist.genres?.slice(0, 2).join(', ');

  return (
    <li className="item-row">
      <span className="item-index">{index}.</span>
      {imageUrl && (
        <img
          src={imageUrl}
          alt={artist.name}
          className="item-image item-image-round"
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
            {artist.name}
          </a>
        </AutoScrollText>
        {genres && (
          <AutoScrollText className="item-subtitle">
            {genres}
          </AutoScrollText>
        )}
      </div>
    </li>
  );
};

export default ArtistItem;