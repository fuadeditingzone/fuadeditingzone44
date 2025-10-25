import React, { useEffect } from 'react';
import type { User } from '../types';
import { CloseIcon } from './Icons';

interface SearchResultsModalProps {
    users: User[];
    onClose: () => void;
    onViewProfile: (user: User) => void;
}

export const SearchResultsModal: React.FC<SearchResultsModalProps> = ({ users, onClose, onViewProfile }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-gray-900/80 border border-gray-700 rounded-2xl w-full max-w-md flex flex-col max-h-[70vh]"
                style={{ animation: 'fade-in-scale 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700/50 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white">Search Results</h2>
                    <button onClick={onClose} aria-label="Close search results" className="text-white/70 hover:text-white transition-colors p-2 rounded-full bg-black/50 hover:bg-red-500">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto p-4 space-y-3">
                    {users.length > 0 ? (
                        users.map(user => (
                            <button 
                                key={user.username} 
                                onClick={() => onViewProfile(user)}
                                className="w-full flex items-center gap-4 p-3 rounded-lg bg-gray-800/50 hover:bg-red-500/20 border border-gray-700 hover:border-red-500/50 transition-all text-left"
                            >
                                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xl font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
                                </div>
                                <div>
                                    <p className="font-bold text-white">{user.name}</p>
                                    <p className="text-sm text-gray-400">@{user.username}</p>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-400">No users found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
