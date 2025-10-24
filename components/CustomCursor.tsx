import React, { useRef, useEffect, useState } from 'react';
import { LOGO_URL } from '../constants';

const createSparks = (x: number, y: number) => {
    const numSparks = 8;
    for (let i = 0; i < numSparks; i++) {
        const spark = document.createElement('div');
        spark.className = 'spark';
        
        const angle = (i / numSparks) * 360;
        const radius = Math.random() * 50 + 50;
        const endX = Math.cos(angle * Math.PI / 180) * radius;
        const endY = Math.sin(angle * Math.PI / 180) * radius;

        spark.style.top = `${y - 3}px`;
        spark.style.left = `${x - 3}px`;
        spark.style.setProperty('--transform-end', `translate(${endX}px, ${endY}px)`);

        document.body.appendChild(spark);
        setTimeout(() => {
            spark.remove();
        }, 800);
    }
};

export const CustomCursor: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
    const cursorRef = useRef<HTMLDivElement>(null);
    const [isHiddenByEdge, setIsHiddenByEdge] = useState(true); // Start hidden until first move
    const [isTyping, setIsTyping] = useState(false);
    
    useEffect(() => {
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const cursorEl = cursorRef.current;

        if (isTouchDevice || !cursorEl) {
            if (cursorEl) cursorEl.style.display = 'none';
            return;
        }

        let animationFrameId: number;
        const lastPosition = { x: -100, y: -100 }; // Start off-screen

        const onMouseMove = (e: MouseEvent) => {
            lastPosition.x = e.clientX;
            lastPosition.y = e.clientY;

            const buffer = 2;
            const atEdge = 
                e.clientX <= buffer ||
                e.clientX >= window.innerWidth - buffer ||
                e.clientY <= buffer ||
                e.clientY >= window.innerHeight - buffer;
            
            setIsHiddenByEdge(atEdge);
        };

        const renderLoop = () => {
            cursorEl.style.transform = `translate3d(${lastPosition.x}px, ${lastPosition.y}px, 0)`;
            animationFrameId = requestAnimationFrame(renderLoop);
        };

        const handleMouseDown = (e: MouseEvent) => {
            createSparks(e.clientX, e.clientY);
        };

        const handleMouseLeave = () => setIsHiddenByEdge(true);
        const handleMouseEnter = () => setIsHiddenByEdge(false);

        const handleFocusIn = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                setIsTyping(true);
            }
        };

        const handleFocusOut = () => {
            setIsTyping(false);
        };

        window.addEventListener('mousemove', onMouseMove, { passive: true });
        window.addEventListener('mousedown', handleMouseDown, true); 
        document.documentElement.addEventListener('mouseleave', handleMouseLeave);
        document.documentElement.addEventListener('mouseenter', handleMouseEnter);
        document.addEventListener('focusin', handleFocusIn);
        document.addEventListener('focusout', handleFocusOut);
        
        renderLoop();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mousedown', handleMouseDown, true);
            document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
            document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
            document.removeEventListener('focusin', handleFocusIn);
            document.removeEventListener('focusout', handleFocusOut);
        };
    }, []);

    const finalIsVisible = isVisible && !isHiddenByEdge && !isTyping;

    return (
        <div ref={cursorRef} className={`custom-cursor ${finalIsVisible ? 'opacity-100' : 'opacity-0'}`}>
            <img src={LOGO_URL} alt="cursor" className="cursor-logo" />
        </div>
    );
};