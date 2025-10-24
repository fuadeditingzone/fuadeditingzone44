import React, { useState, useRef, useEffect, useCallback } from 'react';

export const useDraggable = (initialPos: { x: number; y: number }) => {
    const [position, setPosition] = useState(initialPos);
    const elementRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);
    const offsetRef = useRef({ x: 0, y: 0 });

    const handleInteractionStart = useCallback((clientX: number, clientY: number) => {
        if (!elementRef.current) return;
        isDraggingRef.current = true;
        const rect = elementRef.current.getBoundingClientRect();
        offsetRef.current = {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
        // Prevent text selection while dragging
        document.body.style.userSelect = 'none';
    }, []);

    const handleInteractionMove = useCallback((clientX: number, clientY: number) => {
        if (!isDraggingRef.current || !elementRef.current) return;

        let newX = clientX - offsetRef.current.x;
        let newY = clientY - offsetRef.current.y;
        
        const elWidth = elementRef.current.offsetWidth;
        const elHeight = elementRef.current.offsetHeight;
        const parentRect = document.body.getBoundingClientRect();

        newX = Math.max(16, Math.min(newX, parentRect.width - elWidth - 16));
        newY = Math.max(16, Math.min(newY, parentRect.height - elHeight - 16));
        
        setPosition({ x: newX, y: newY });
    }, []);

    const handleInteractionEnd = useCallback(() => {
        isDraggingRef.current = false;
        document.body.style.userSelect = '';
    }, []);

    // Mouse events
    const handleMouseDown = (e: React.MouseEvent) => handleInteractionStart(e.clientX, e.clientY);
    const handleMouseMove = (e: MouseEvent) => handleInteractionMove(e.clientX, e.clientY);

    // Touch events
    const handleTouchStart = (e: React.TouchEvent) => handleInteractionStart(e.touches[0].clientX, e.touches[0].clientY);
    const handleTouchMove = (e: TouchEvent) => handleInteractionMove(e.touches[0].clientX, e.touches[0].clientY);

    useEffect(() => {
        // Use window for move/end listeners to catch events outside the element
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleInteractionEnd);
        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('touchend', handleInteractionEnd);
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleInteractionEnd);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleInteractionEnd);
        };
    }, [handleMouseMove, handleInteractionEnd, handleTouchMove]);

    return { ref: elementRef, position, handleMouseDown, handleTouchStart };
};