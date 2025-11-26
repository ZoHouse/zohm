'use client';

import React, { useState, useEffect, useRef } from 'react';

// Helper component for scaling the modal content
export function ScaleContainer({ children }: { children: React.ReactNode }) {
    const [scale, setScale] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleResize = () => {
            // Calculate scale based on window width directly
            const windowWidth = window.innerWidth;
            const padding = 32; // 16px padding on each side
            const availableWidth = windowWidth - padding;
            const targetWidth = 1200;

            // Calculate scale to fit width
            const newScale = Math.min(1, availableWidth / targetWidth);
            setScale(newScale);
        };

        // Initial calculation
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative flex justify-center overflow-hidden transition-all duration-200 ease-out"
            style={{
                width: '100%',
                height: `${675 * scale}px`, // Dynamic height based on scale
            }}
        >
            <div
                style={{
                    width: '1200px',
                    height: '675px',
                    transform: `scale(${scale})`,
                    transformOrigin: 'top center', // Scale from top center
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    marginLeft: '-600px', // Center the 1200px element horizontally
                }}
            >
                {children}
            </div>
        </div>
    );
}
