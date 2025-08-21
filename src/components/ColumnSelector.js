import './ColumnSelector.css';

const ColumnSelector = ({ columns, onChange, maxColumns = 5 }) => {
  const columnOptions = Array.from({ length: maxColumns }, (_, i) => i + 1);

  return (
    <div className="column-selector">
      <label htmlFor="column-select" className="column-label">
        Columns:
      </label>
      <select
        id="column-select"
        value={columns}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="column-select"
      >
        {columnOptions.map(num => (
          <option key={num} value={num}>
            {num}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ColumnSelector;