import React, { useState, useEffect, useRef, useCallback } from 'react';

interface WelcomeScreenProps {
    onEnter: () => void;
    onInteraction: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onEnter, onInteraction }) => {
    const [showVortex, setShowVortex] = useState(true);
    const onEnterCalledRef = useRef(false);
    const onInteractionCalledRef = useRef(false);

    const triggerEnter = useCallback(() => {
        if (!onEnterCalledRef.current) {
            onEnterCalledRef.current = true;
            onEnter();
        }
    }, [onEnter]);

    const triggerInteraction = useCallback(() => {
        if (!onInteractionCalledRef.current) {
            onInteractionCalledRef.current = true;
            onInteraction();
        }
    }, [onInteraction]);

    useEffect(() => {
        const vortexTimer = setTimeout(() => {
            setShowVortex(false);
        }, 1500); // Vortex animation duration

        // Fallback timer if the user doesn't interact
        const enterTimer = setTimeout(() => {
            triggerEnter();
        }, 5500);

        // This handler will be called on the first user interaction
        const handleInteraction = () => {
            triggerInteraction(); // Unlock audio
            triggerEnter();       // Transition UI
        };

        // Add event listeners that fire only once to skip the intro
        window.addEventListener('mousedown', handleInteraction, { once: true });
        window.addEventListener('touchstart', handleInteraction, { once: true });
        window.addEventListener('wheel', handleInteraction, { once: true });
        window.addEventListener('keydown', handleInteraction, { once: true });

        // Cleanup function to clear timers if the component unmounts
        return () => {
            clearTimeout(vortexTimer);
            clearTimeout(enterTimer);
            // 'once' listeners remove themselves, but it's good practice to have this
            // in case the logic changes in the future.
            window.removeEventListener('mousedown', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            window.removeEventListener('wheel', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
        };
    }, [triggerEnter, triggerInteraction]);

    return (
        <div className="welcome-screen fixed inset-0 z-[100]">
            {showVortex && <div className="vortex" />}
            
            {!showVortex && (
                <div className="welcome-container text-center">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold font-poppins text-white tracking-tight">Assalamu Alaikum</h1>
                        <p className="max-w-xl mx-auto mt-4 text-base md:text-lg text-gray-300 font-inter">
                            Welcome to the creative dimension of Fuad Editing Zone.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};