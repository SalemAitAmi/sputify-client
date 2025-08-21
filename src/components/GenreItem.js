import './ItemComponents.css';

const GenreItem = ({ genre, index }) => {
  if (!genre) return null;

  const percentage = Math.round(genre.percentage);

  return (
    <li className="genre-item">
      <div className="genre-header">
        <span className="item-index">{index}.</span>
        <span className="genre-name">{genre.name}</span>
        <span className="genre-percentage">{percentage}%</span>
      </div>
      <div className="genre-bar-container">
        <div 
          className="genre-bar"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </li>
  );
};

export default GenreItem;