import React, { useEffect } from 'react';
import { SOCIAL_LINKS } from '../constants';
import { CloseIcon } from './Icons';
import type { User } from '../types';

interface ProfileModalProps {
    user: User;
    onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose }) => {

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="perspective">
                <div 
                    className="relative bg-gray-900/80 border border-red-500/30 rounded-2xl p-8 max-w-sm w-full shadow-2xl shadow-red-500/10 text-center transform-style-3d animate-flip-in-3d" 
                    onClick={e => e.stopPropagation()}
                >
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10"
                        aria-label="Close profile"
                    >
                        <CloseIcon className="w-6 h-6" />
                    </button>
                    
                    <div className="relative w-28 h-28 mx-auto">
                        <div className="w-full h-full rounded-full bg-red-600 flex items-center justify-center border-4 border-gray-700 glow-shadow">
                           <span className="text-5xl font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold mt-4 text-white">{user.name}</h2>
                    <p className="text-gray-400">@{user.username}</p>
                    <p className="text-red-500 font-semibold mt-1">{user.profession}</p>
                    
                    {user.bio && (
                      <div className="text-center mt-4 text-gray-300 bg-black/20 p-3 rounded-lg">
                          <p>{user.bio}</p>
                      </div>
                    )}
                </div>
            </div>
        </div>
    );
};