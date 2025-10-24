
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PROFILE_PIC_URL } from '../constants';

interface FloatingChatButtonProps {
    onClick: () => void;
    unreadMessageCount: number;
    isChatBotSpeaking: boolean;
    isOpen: boolean;
}

export const FloatingChatButton = React.forwardRef<HTMLDivElement, FloatingChatButtonProps>(({ onClick, unreadMessageCount, isChatBotSpeaking, isOpen }, ref) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => wrapperRef.current!, []);

    const [position, setPosition] = useState({ x: 0, y: 0 });
    const dragInfo = useRef({
        isDragging: false,
        startX: 0,
        startY: 0,
        initialX: 0,
        initialY: 0,
        hasDragged: false
    });

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        dragInfo.current.isDragging = true;
        dragInfo.current.hasDragged = false;
        dragInfo.current.startX = e.clientX;
        dragInfo.current.startY = e.clientY;
        dragInfo.current.initialX = position.x;
        dragInfo.current.initialY = position.y;
    }, [position]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!dragInfo.current.isDragging || !wrapperRef.current) return;
            
            const dx = e.clientX - dragInfo.current.startX;
            const dy = e.clientY - dragInfo.current.startY;
            
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
              dragInfo.current.hasDragged = true;
            }

            setPosition({
                x: dragInfo.current.initialX + dx,
                y: dragInfo.current.initialY + dy
            });
        };

        const handleMouseUp = () => {
            dragInfo.current.isDragging = false;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (dragInfo.current.hasDragged) {
            e.preventDefault();
            return;
        }
        onClick();
    };
    
    const isSpeakingInBackground = !isOpen && isChatBotSpeaking;

    return (
        <div
            ref={wrapperRef}
            onMouseDown={handleMouseDown}
            style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
            className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[75] w-16 h-16 cursor-grab ${dragInfo.current.isDragging ? 'cursor-grabbing' : ''}`}
        >
            <button
                onClick={handleClick}
                className={`w-full h-full bg-red-600 text-white rounded-full shadow-lg btn-glow flex items-center justify-center transform transition-all duration-300 hover:scale-110 overflow-hidden cursor-pointer ${isOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}
                aria-label="Open chat"
            >
                <img src={PROFILE_PIC_URL} alt="Chat with Fuad Ahmed" className="w-full h-full object-cover" />
                
                {isSpeakingInBackground && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="fcb-waveform">
                            <div className="fcb-bar"></div>
                            <div className="fcb-bar"></div>
                            <div className="fcb-bar"></div>
                            <div className="fcb-bar"></div>
                            <div className="fcb-bar"></div>
                        </div>
                    </div>
                )}
            </button>
            
            {unreadMessageCount > 0 && !isOpen && (
                <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 pointer-events-none">
                    <span className="relative flex h-6 w-6">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex items-center justify-center rounded-full h-6 w-6 bg-red-500 text-white text-xs font-bold border-2 border-white">
                            {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                        </span>
                    </span>
                </div>
            )}
        </div>
    );
});
