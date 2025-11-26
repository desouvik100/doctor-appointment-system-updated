import React from 'react';

// Minimal loading component to prevent layout shifts
const OptimizedLoader = ({
    size = 'medium',
    text = 'Loading...',
    inline = false,
    height = null
}) => {
    const sizeMap = {
        small: '16px',
        medium: '24px',
        large: '32px'
    };

    const spinnerSize = sizeMap[size] || sizeMap.medium;

    const containerStyle = {
        display: inline ? 'inline-flex' : 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: inline ? '0' : '1rem',
        height: height || (inline ? 'auto' : '100px'),
        // Prevent layout shift
        minHeight: inline ? 'auto' : '100px',
        // GPU acceleration
        transform: 'translate3d(0, 0, 0)',
        contain: 'layout style paint'
    };

    const spinnerStyle = {
        width: spinnerSize,
        height: spinnerSize,
        border: '2px solid #e2e8f0',
        borderTop: '2px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        // GPU acceleration
        transform: 'translate3d(0, 0, 0)',
        willChange: 'transform'
    };

    const textStyle = {
        fontSize: size === 'small' ? '0.75rem' : '0.875rem',
        color: '#64748b',
        fontWeight: '500'
    };

    return (
        <div style={containerStyle}>
            <div style={spinnerStyle}></div>
            {text && <span style={textStyle}>{text}</span>}
        </div>
    );
};

// Skeleton loader for better perceived performance
export const SkeletonLoader = ({
    rows = 3,
    height = '1rem',
    className = ''
}) => {
    const skeletonStyle = {
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s infinite',
        borderRadius: '4px',
        height,
        marginBottom: '0.5rem',
        // GPU acceleration
        transform: 'translate3d(0, 0, 0)',
        contain: 'layout style paint'
    };

    return (
        <div className={className}>
            {Array.from({ length: rows }, (_, index) => (
                <div
                    key={index}
                    style={{
                        ...skeletonStyle,
                        width: index === rows - 1 ? '60%' : '100%' // Last row shorter
                    }}
                />
            ))}
        </div>
    );
};

// Table skeleton for data tables
export const TableSkeleton = ({
    rows = 5,
    columns = 4
}) => {
    return (
        <div style={{
            background: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid #e2e8f0'
        }}>
            {/* Header skeleton */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: '1rem',
                padding: '1rem',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0'
            }}>
                {Array.from({ length: columns }, (_, index) => (
                    <SkeletonLoader key={index} rows={1} height="1rem" />
                ))}
            </div>

            {/* Rows skeleton */}
            {Array.from({ length: rows }, (_, rowIndex) => (
                <div
                    key={rowIndex}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${columns}, 1fr)`,
                        gap: '1rem',
                        padding: '1rem',
                        borderBottom: rowIndex < rows - 1 ? '1px solid #e2e8f0' : 'none'
                    }}
                >
                    {Array.from({ length: columns }, (_, colIndex) => (
                        <SkeletonLoader key={colIndex} rows={1} height="0.875rem" />
                    ))}
                </div>
            ))}
        </div>
    );
};

// Card skeleton
export const CardSkeleton = ({
    showHeader = true,
    bodyRows = 3
}) => {
    return (
        <div style={{
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
        }}>
            {showHeader && (
                <div style={{
                    padding: '1rem',
                    borderBottom: '1px solid #e2e8f0'
                }}>
                    <SkeletonLoader rows={1} height="1.25rem" />
                </div>
            )}
            <div style={{ padding: '1rem' }}>
                <SkeletonLoader rows={bodyRows} />
            </div>
        </div>
    );
};

export default OptimizedLoader;