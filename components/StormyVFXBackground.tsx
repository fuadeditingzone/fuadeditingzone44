

import React, { useRef, useEffect } from 'react';

interface GalaxyBackgroundProps {
  onLightningFlash: () => void;
  isParallaxActive: boolean;
}

export const GalaxyBackground: React.FC<GalaxyBackgroundProps> = ({ onLightningFlash, isParallaxActive }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleMouseMove = (event: MouseEvent) => {
            const { clientX, clientY } = event;
            const x = (clientX / window.innerWidth - 0.5) * 5; // degrees
            const y = (clientY / window.innerHeight - 0.5) * -5; // degrees
            container.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
        };

        if (isParallaxActive) {
            window.addEventListener('mousemove', handleMouseMove);
        } else {
            // Reset transform when parallax is inactive for a smooth stop
            container.style.transform = 'rotateY(0deg) rotateX(0deg)';
        }


        const flashInterval = setInterval(() => {
            if (Math.random() < 0.1) {
                onLightningFlash();
            }
        }, 4000);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            clearInterval(flashInterval);
        };
    }, [onLightningFlash, isParallaxActive]);

    return (
        <div 
            ref={containerRef}
            className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden"
            style={{ perspective: '600px', transition: 'transform 0.5s ease-out' }}
        >
            <div className="galaxy-nebula" />
            <div className="hyperspace-container slow-down">
                 <div className="stars-plane stars-plane-1" />
                 <div className="stars-plane stars-plane-2" />
                 <div className="stars-plane stars-plane-3" />
            </div>
        </div>
    );
};