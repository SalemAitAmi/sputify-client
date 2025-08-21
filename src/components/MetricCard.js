import { useRef, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import './MetricCard.css';

const MetricCard = ({
  id,
  title,
  children,
  isLoading,
  displayCount,
  totalAvailable,
  hardLimit,
  onLoadMore,
  isDraggable = false,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: isDraggable ? id : null,
    disabled: !isDraggable,
  });

  const style = isDraggable
    ? {
        transform: CSS.Transform.toString(transform),
        transition: 'none',
        zIndex: isDragging ? 1000 : 'auto',
        opacity: isDragging ? 0.9 : 1,
      }
    : {};

  const observer = useRef(null);
  const lastElementRef = useCallback(
    (node) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();
      
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && displayCount < hardLimit && onLoadMore) {
            onLoadMore();
          }
        },
        { threshold: 0.1 }
      );
      
      if (node) observer.current.observe(node);
    },
    [isLoading, displayCount, hardLimit, onLoadMore]
  );

  return (
    <div
      ref={isDraggable ? setNodeRef : null}
      style={style}
      className={`metric-card ${isDragging ? 'dragging' : ''}`}
    >
      <div className="metric-card-header">
        <h3 className="metric-card-title">{title}</h3>
        {isDraggable && (
          <div
            className="drag-handle"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={20} />
          </div>
        )}
      </div>
      
      <div className="metric-card-content">
        {isLoading ? (
          <div className="metric-card-loading">
            <div className="loading-spinner"></div>
            <p>Loading...</p>
          </div>
        ) : (
          <>
            {children}
            {onLoadMore && displayCount < totalAvailable && displayCount < hardLimit && (
              <div ref={lastElementRef} className="load-more-trigger">
                <div className="loading-spinner small"></div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MetricCard;