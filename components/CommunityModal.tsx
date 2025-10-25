import React, { useEffect, useState } from 'react';
import type { User } from '../types';
import { useUser } from '../contexts/UserContext';
import { CloseIcon } from './Icons';
import { LazyImage } from './LazyImage';

interface CommunityModalProps {
    onClose: () => void;
    onViewProfile: (username: string) => void;
}

export const CommunityModal: React.FC<CommunityModalProps> = ({ onClose, onViewProfile }) => {
    const { getAllUsers } = useUser();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            const allUsers = await getAllUsers();
            setUsers(allUsers);
            setLoading(false);
        };
        fetchUsers();
    }, [getAllUsers]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4 sm:p-8 animate-fade-in" onClick={onClose}>
            <div className="bg-gray-900/80 border border-gray-700 rounded-2xl w-full h-full max-w-5xl flex flex-col" style={{ animation: 'fade-in-scale 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-gray-700/50 flex-shrink-0">
                    <h2 className="text-3xl font-bold font-poppins text-white">Community</h2>
                    <button onClick={onClose} aria-label="Close community view" className="text-white/70 hover:text-white transition-colors p-2 rounded-full bg-black/50 hover:bg-[#e50914]">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="w-12 h-12 border-4 border-t-red-500 border-gray-600 rounded-full animate-spin"></div>
                        </div>
                    ) : users.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {users.map((user, index) => (
                                <button key={user.uid} onClick={() => onViewProfile(user.username)} className="group text-center transition-transform duration-300 hover:-translate-y-1">
                                    <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow-lg shadow-black/40 border-2 border-gray-800 group-hover:border-red-500 transition-all">
                                        {user.avatarUrl ? (
                                            <LazyImage src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" loadIndex={index} />
                                        ) : (
                                            <div className="w-full h-full bg-red-600 flex items-center justify-center">
                                                <span className="text-5xl font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="mt-3 font-bold text-white truncate">{user.name}</h3>
                                    <p className="text-sm text-gray-400">@{user.username}</p>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <h3 className="text-2xl font-bold text-white">It's a Bit Quiet Here</h3>
                            <p className="text-gray-400 mt-2">Be the first to join the community and get your profile featured!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};