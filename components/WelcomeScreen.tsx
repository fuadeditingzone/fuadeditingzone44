import React, { useState, useEffect } from 'react';

interface WelcomeScreenProps {
    onEnter: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onEnter }) => {
    const [showVortex, setShowVortex] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowVortex(false);
        }, 1500); // Vortex animation duration
        return () => clearTimeout(timer);
    }, []);

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
                        <button 
                            onClick={onEnter}
                            className="mt-8 btn-glow bg-[#e50914] text-white font-bold py-3 px-8 rounded-full transition-all duration-300 hover:bg-red-700 transform hover:scale-105"
                        >
                            Enter Zone
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
