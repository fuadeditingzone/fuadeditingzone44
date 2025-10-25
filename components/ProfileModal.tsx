import React, { useEffect, useState } from 'react';
import { CloseIcon, LinkedInIcon, FacebookIcon, InstagramIcon, BehanceIcon } from './Icons';
import type { User } from '../types';

interface ProfileModalProps {
    user: User;
    onClose: () => void;
}

const SocialIconLink: React.FC<{ href: string; icon: React.ComponentType<{ className?: string }>; name: string; }> = ({ href, icon: Icon, name }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={name}
       className="group relative w-12 h-12 flex items-center justify-center bg-gray-800/70 border-2 border-gray-700 rounded-full transition-all duration-300 transform-gpu hover:border-[#e50914] hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-[#e50914]">
        <Icon className="text-xl text-white" />
    </a>
);

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose }) => {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleCopyUsername = () => {
        navigator.clipboard.writeText(`@${user.username}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    const hasSocials = user.linkedinUrl || user.facebookUrl || user.instagramUrl || user.behanceUrl;

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
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} className="w-28 h-28 rounded-full object-cover border-4 border-gray-700 glow-shadow" />
                        ) : (
                            <div className="w-full h-full rounded-full bg-red-600 flex items-center justify-center border-4 border-gray-700 glow-shadow">
                               <span className="text-5xl font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
                            </div>
                        )}
                    </div>

                    <h2 className="text-3xl font-bold mt-4 text-white">{user.name}</h2>
                    <div className="relative inline-block">
                        <button onClick={handleCopyUsername} className="text-gray-400 hover:text-white transition-colors cursor-pointer" title="Copy username">
                            @{user.username}
                        </button>
                        {copied && <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-md animate-fade-in whitespace-nowrap">Copied!</span>}
                    </div>
                    <p className="text-red-500 font-semibold mt-1">{user.profession}</p>
                    
                    {user.bio && (
                      <div className="text-center mt-4 text-gray-300 bg-black/20 p-3 rounded-lg">
                          <p>{user.bio}</p>
                      </div>
                    )}
                    
                    {hasSocials && (
                        <div className="mt-6 border-t border-gray-700 pt-6 flex flex-wrap justify-center items-center gap-4">
                            {user.linkedinUrl && <SocialIconLink href={user.linkedinUrl} icon={LinkedInIcon} name="LinkedIn" />}
                            {user.facebookUrl && <SocialIconLink href={user.facebookUrl} icon={FacebookIcon} name="Facebook" />}
                            {user.instagramUrl && <SocialIconLink href={user.instagramUrl} icon={InstagramIcon} name="Instagram" />}
                            {user.behanceUrl && <SocialIconLink href={user.behanceUrl} icon={BehanceIcon} name="Behance" />}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};