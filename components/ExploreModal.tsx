import React, { useEffect, useState } from 'react';
import type { Post } from '../types';
import { useMarketplace } from '../contexts/MarketplaceContext';
import { CloseIcon, PlayIcon } from './Icons';
import { LazyImage } from './LazyImage';

interface ExploreModalProps {
    onClose: () => void;
    onViewPost: (post: Post) => void;
    onViewProfile: (username: string) => void;
}

export const ExploreModal: React.FC<ExploreModalProps> = ({ onClose, onViewPost, onViewProfile }) => {
    const { posts, incrementPostView } = useMarketplace();
    const [sortedPosts, setSortedPosts] = useState<Post[]>([]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        // Sort by views (click rate) descending, then by creation date
        const sorted = [...posts].sort((a, b) => {
            if (b.views !== a.views) {
                return b.views - a.views;
            }
            return b.createdAt - a.createdAt;
        });
        setSortedPosts(sorted);
    }, [posts]);
    
    const handlePostClick = (post: Post) => {
        incrementPostView(post.id);
        // This will be handled by a new PostDetailsModal in a future step
        // For now, it could open a simple viewer or do nothing
        console.log("Viewing post:", post.title);
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4 sm:p-8 animate-fade-in" onClick={onClose}>
            <div className="bg-gray-900/80 border border-gray-700 rounded-2xl w-full h-full max-w-7xl flex flex-col" style={{ animation: 'fade-in-scale 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-gray-700/50 flex-shrink-0">
                    <h2 className="text-3xl font-bold font-poppins text-white">Explore</h2>
                    <button onClick={onClose} aria-label="Close explore" className="text-white/70 hover:text-white transition-colors p-2 rounded-full bg-black/50 hover:bg-[#e50914]">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto p-6">
                    {sortedPosts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {sortedPosts.map((post, index) => (
                                <div key={post.id} className="group relative rounded-lg overflow-hidden shadow-lg shadow-black/40 cursor-pointer w-full aspect-[4/3]">
                                    <button onClick={() => handlePostClick(post)} className="w-full h-full block">
                                        <LazyImage src={post.type === 'image' ? post.mediaUrl : post.thumbnailUrl || ''} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110" loadIndex={index} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        {post.type === 'video' && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <PlayIcon className="w-12 h-12 text-white/80 transform scale-75 group-hover:scale-90 transition-transform duration-300" />
                                            </div>
                                        )}
                                    </button>
                                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none">
                                        <h3 className="font-bold truncate">{post.title}</h3>
                                        <button onClick={(e) => { e.stopPropagation(); onViewProfile(post.authorUsername); }} className="text-sm text-gray-300 hover:text-red-400 transition-colors flex items-center gap-2 mt-1 pointer-events-auto">
                                            {post.authorAvatarUrl ? <img src={post.authorAvatarUrl} className="w-5 h-5 rounded-full object-cover"/> : <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-xs">{post.authorName.charAt(0)}</div>}
                                            {post.authorName}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <h3 className="text-2xl font-bold text-white">The Canvas is a Bit Empty</h3>
                            <p className="text-gray-400 mt-2">No masterpieces have been uploaded yet. Why not be the first?</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};