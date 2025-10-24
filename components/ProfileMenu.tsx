import React, { useEffect, useRef } from 'react';

interface ProfileMenuProps {
    onClose: () => void;
    onLogout: () => void;
    onViewProfile: () => void;
    onEditProfile: () => void;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ onClose, onLogout, onViewProfile, onEditProfile }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            className="absolute top-full right-0 mt-3 w-48 bg-gray-900/80 backdrop-blur-lg border border-gray-700 rounded-lg shadow-2xl shadow-black/50 overflow-hidden animate-fade-in"
            style={{ animation: 'fade-in-scale 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
        >
            <div className="p-2 space-y-1">
                <button
                    onClick={() => { onViewProfile(); onClose(); }}
                    className="group w-full flex items-center text-left px-3 py-2 text-sm text-gray-200 rounded-md hover:bg-red-500/20 hover:text-white transition-all duration-200"
                >
                    View My Profile
                </button>
                <button
                    onClick={() => { onEditProfile(); onClose(); }}
                    className="group w-full flex items-center text-left px-3 py-2 text-sm text-gray-200 rounded-md hover:bg-red-500/20 hover:text-white transition-all duration-200"
                >
                    Edit Profile
                </button>
                <button
                    onClick={() => { onLogout(); onClose(); }}
                    className="group w-full flex items-center text-left px-3 py-2 text-sm text-gray-200 rounded-md hover:bg-red-500/20 hover:text-white transition-all duration-200"
                >
                    Logout
                </button>
            </div>
        </div>
    );
};