import { Music, Users } from 'lucide-react';
import './ItemComponents.css';
import './GenreItem.css';

const GenreItem = ({ genre, index }) => {
  if (!genre) return null;

  const trackCount = genre.trackCount ?? 'N/A';
  const artistCount = genre.artistCount ?? 'N/A';

  return (
    <li className="genre-item">
      <div className="genre-header">
        <span className="item-index">{index}.</span>
        <span className="genre-name">{genre.name}</span>
      </div>
      <div className="genre-stats">
        <div className="genre-stat">
          <Music size={14} className="genre-stat-icon" />
          <span className="genre-stat-value">{trackCount}</span>
          <span className="genre-stat-label">tracks</span>
        </div>
        <div className="genre-stat-divider" />
        <div className="genre-stat">
          <Users size={14} className="genre-stat-icon" />
          <span className="genre-stat-value">{artistCount}</span>
          <span className="genre-stat-label">artists</span>
        </div>
      </div>
    </li>
  );
};

export default GenreItem;