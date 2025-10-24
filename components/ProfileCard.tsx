import React, { useEffect } from 'react';
import { PROFILE_PIC_URL, SOCIAL_LINKS } from '../constants';
import { CloseIcon } from './Icons';

interface ProfileCardProps {
    onClose: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ onClose }) => {
    const startYear = 2020;
    const currentYear = new Date().getFullYear();
    const yearsOfExperience = currentYear - startYear;
    const expertiseTags = ["Photo Manipulation", "Thumbnails", "VFX Edits"];

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="perspective">
                <div 
                    className="relative bg-gray-900/70 border border-red-500/30 rounded-2xl p-8 max-w-sm w-full shadow-2xl shadow-red-500/10 text-center transform-style-3d animate-flip-in-3d" 
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
                        <img src={PROFILE_PIC_URL} alt="Fuad Ahmed" className="w-full h-full rounded-full border-4 border-gray-700 glow-shadow" />
                    </div>

                    <h2 className="text-3xl font-bold mt-4 text-white">Fuad Ahmed</h2>
                    <p className="text-red-500 font-semibold mt-1">Graphic Designer & VFX Editor</p>
                    
                    <div className="text-left mt-6 space-y-2 text-gray-300">
                        <p><strong>Experience:</strong> {yearsOfExperience}+ Years (Since {startYear})</p>
                        <p><strong>Location:</strong> Sylhet, Bangladesh</p>
                    </div>

                    <div className="mt-4 text-left">
                         <h3 className="font-semibold text-gray-200 mb-2">Expert In:</h3>
                         <div className="flex flex-wrap gap-2">
                            {expertiseTags.map(tag => (
                                <span key={tag} className="bg-red-500/20 text-red-300 text-xs font-semibold px-3 py-1 rounded-full">{tag}</span>
                            ))}
                         </div>
                    </div>
                    
                    <div className="mt-6 border-t border-gray-700 pt-4 flex flex-wrap justify-center items-center gap-x-3 gap-y-2 text-sm">
                      {SOCIAL_LINKS.map((link, index) => (
                        <React.Fragment key={link.name}>
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-red-500 transition-colors font-medium">
                            {link.name}
                          </a>
                          {index < SOCIAL_LINKS.length - 1 && <span className="text-gray-600">|</span>}
                        </React.Fragment>
                      ))}
                    </div>
                </div>
            </div>
        </div>
    );
};