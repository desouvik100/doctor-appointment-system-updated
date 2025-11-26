import React, { useState, useEffect, useMemo, useCallback } from 'react';

const VirtualizedTable = ({ 
  data = [], 
  columns = [], 
  rowHeight = 50, 
  containerHeight = 400,
  onRowClick = null 
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerRef, setContainerRef] = useState(null);

  // Calculate visible items for virtualization
  const visibleItems = useMemo(() => {
    if (!data.length) return { startIndex: 0, endIndex: 0, items: [] };
    
    const startIndex = Math.floor(scrollTop / rowHeight);
    const visibleCount = Math.ceil(containerHeight / rowHeight);
    const endIndex = Math.min(startIndex + visibleCount + 2, data.length); // +2 for buffer
    
    return {
      startIndex,
      endIndex,
      items: data.slice(startIndex, endIndex)
    };
  }, [data, scrollTop, rowHeight, containerHeight]);

  // Handle scroll with throttling for performance
  const handleScroll = useCallback((e) => {
    const scrollTop = e.target.scrollTop;
    setScrollTop(scrollTop);
  }, []);

  // Memoized row renderer to prevent unnecessary re-renders
  const renderRow = useCallback((item, index) => {
    const actualIndex = visibleItems.startIndex + index;
    
    return (
      <tr 
        key={item.id || actualIndex}
        className="table-row"
        style={{
          height: `${rowHeight}px`,
          transform: `translate3d(0, 0, 0)` // GPU acceleration
        }}
        onClick={() => onRowClick && onRowClick(item)}
      >
        {columns.map((column, colIndex) => (
          <td 
            key={colIndex}
            className="table-cell"
            style={{ 
              padding: '0.5rem',
              borderBottom: '1px solid #e2e8f0',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {column.render ? column.render(item) : item[column.key]}
          </td>
        ))}
      </tr>
    );
  }, [columns, rowHeight, visibleItems.startIndex, onRowClick]);

  if (!data.length) {
    return (
      <div className="table-container" style={{ height: containerHeight }}>
        <div className="empty-state" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100%',
          color: '#64748b'
        }}>
          No data available
        </div>
      </div>
    );
  }

  return (
    <div 
      className="virtualized-table-container"
      style={{ 
        height: containerHeight,
        overflow: 'auto',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        background: 'white'
      }}
      onScroll={handleScroll}
      ref={setContainerRef}
    >
      {/* Header */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ 
          position: 'sticky', 
          top: 0, 
          background: '#f8fafc',
          zIndex: 10 
        }}>
          <tr>
            {columns.map((column, index) => (
              <th 
                key={index}
                style={{
                  padding: '0.75rem 0.5rem',
                  textAlign: 'left',
                  fontWeight: 600,
                  color: '#374151',
                  borderBottom: '2px solid #e2e8f0',
                  fontSize: '0.875rem'
                }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
      </table>

      {/* Virtual scrolling container */}
      <div style={{ 
        height: data.length * rowHeight,
        position: 'relative'
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          position: 'absolute',
          top: visibleItems.startIndex * rowHeight
        }}>
          <tbody>
            {visibleItems.items.map((item, index) => renderRow(item, index))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(VirtualizedTable);