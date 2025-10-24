import React, { useState, useRef, useEffect } from 'react';
import type { GraphicWork, VideoWork, PortfolioTab, VfxSubTab } from '../types';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { LazyImage } from './LazyImage';
import { GRAPHIC_WORKS, ANIME_EDITS, VFX_EDITS } from '../constants';
import { PlayIcon, TikTokIcon, PauseIcon, VolumeOnIcon, VolumeOffIcon } from './Icons';

interface PortfolioProps {
    openModal: (items: (GraphicWork | VideoWork)[], startIndex: number) => void;
    isReflecting: boolean;
    activeTab: PortfolioTab;
    setActiveTab: (tab: PortfolioTab) => void;
    activeVfxSubTab: VfxSubTab;
    setActiveVfxSubTab: (subTab: VfxSubTab) => void;
    onVideoPlaybackChange: (isPlaying: boolean) => void;
}

// Dedicated component for the custom VFX video player
const VfxVideoPlayer: React.FC<{
    video: VideoWork;
    isPlaying: boolean;
    onPlayRequest: () => void;
}> = ({ video, isPlaying, onPlayRequest }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const videoEl = videoRef.current;
        if (!videoEl) return;
        
        if (isPlaying) {
            videoEl.volume = 0.4;
            setIsMuted(false);
            const playPromise = videoEl.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    if ((error as DOMException).name !== 'AbortError') {
                        console.error("Video play failed:", error);
                    }
                });
            }
        } else {
            videoEl.pause();
        }
    }, [isPlaying]);
    
    const handleTimeUpdate = () => {
        const videoEl = videoRef.current;
        if (videoEl && videoEl.duration) {
            setProgress((videoEl.currentTime / videoEl.duration) * 100);
        }
    };

    const handleLoadedMetadata = () => {
        const videoEl = videoRef.current;
        if (videoEl) {
            setDuration(videoEl.duration);
        }
    };
    
    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const progressEl = progressRef.current;
        const videoEl = videoRef.current;
        if (!progressEl || !videoEl || !duration) return;
        
        const rect = progressEl.getBoundingClientRect();
        const newProgress = ((e.clientX - rect.left) / rect.width);
        videoEl.currentTime = newProgress * duration;
        setProgress(newProgress * 100);
    };
    
    return (
        <div 
            className={`relative group w-full max-w-[270px] aspect-square rounded-lg overflow-hidden shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-2 ${isPlaying ? 'border-red-500 shadow-red-500/40' : 'border-gray-800 shadow-black/40 hover:border-red-500/50'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
             {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                    <div className="w-8 h-8 border-4 border-t-red-500 border-gray-600 rounded-full animate-spin"></div>
                </div>
            )}
            <video
                ref={videoRef}
                src={video.url}
                loop
                muted={isMuted}
                playsInline
                preload="metadata"
                className="w-full h-full object-cover"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onCanPlay={() => setIsLoading(false)}
                onEnded={() => setProgress(0)}
                onClick={onPlayRequest}
            />
            <div className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-300 pointer-events-none z-10 ${isHovered && !isLoading ? 'opacity-100' : 'opacity-0'}`} />

            {!isPlaying && !isLoading && (
                <button onClick={onPlayRequest} className="absolute inset-0 flex items-center justify-center w-full h-full z-10">
                    <PlayIcon className="w-12 h-12 text-white drop-shadow-lg transform transition-transform group-hover:scale-110" />
                </button>
            )}

            <div className={`absolute bottom-0 left-0 right-0 p-2 z-20 transition-all duration-300 transform ${isHovered && !isLoading ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div 
                    ref={progressRef}
                    className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer mb-2"
                    onClick={handleSeek}
                >
                    <div className="h-full bg-red-600 rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex items-center justify-between">
                    <button onClick={onPlayRequest} className="text-white p-1">
                        {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                    </button>
                    <button onClick={() => setIsMuted(prev => !prev)} className="text-white p-1">
                        {isMuted ? <VolumeOffIcon className="w-5 h-5" /> : <VolumeOnIcon className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const Portfolio: React.FC<PortfolioProps> = ({ openModal, isReflecting, activeTab, setActiveTab, activeVfxSubTab, setActiveVfxSubTab, onVideoPlaybackChange }) => {
    const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1, triggerOnce: true });
    const animationClass = isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10';
    const titleRef = useRef<HTMLHeadingElement>(null);
    const [playingVideoId, setPlayingVideoId] = useState<number | null>(null);

    useEffect(() => {
        const el = titleRef.current;
        if (!el) return;
        el.style.transition = 'transform 0.2s ease-out';
        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            const x = (clientX / window.innerWidth - 0.5) * -15;
            const y = (clientY / window.innerHeight - 0.5) * -15;
            el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Stop video when switching tabs
    useEffect(() => {
        setPlayingVideoId(null);
    }, [activeTab, activeVfxSubTab]);

    useEffect(() => {
        onVideoPlaybackChange(playingVideoId !== null);
    }, [playingVideoId, onVideoPlaybackChange]);


    const handlePlayRequest = (videoId: number) => {
        setPlayingVideoId(prevId => (prevId === videoId ? null : videoId));
    };

    const renderGraphicDesign = () => {
        const categories: GraphicWork['category'][] = ['Photo Manipulation', 'YouTube Thumbnails', 'Banner Designs'];
        return (
            <div className="space-y-16">
                {categories.map(category => (
                    <div key={category}>
                        <h3 id={`graphic-category-${category}`} className="text-3xl font-bold mb-8 tracking-wide text-center text-white transition-all duration-300 scroll-mt-24">{category === 'Photo Manipulation' ? 'Photo Manipulation / Social Media Posts' : category}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {GRAPHIC_WORKS.filter(work => work.category === category).map((work, index) => (
                                <button key={work.id}
                                    onClick={() => {
                                        const categoryWorks = GRAPHIC_WORKS.filter(w => w.category === category);
                                        const clickedIndex = categoryWorks.findIndex(w => w.id === work.id);
                                        openModal(categoryWorks, clickedIndex);
                                    }}
                                    className={`image-sound-hover group relative overflow-hidden rounded-lg shadow-lg shadow-black/40 cursor-pointer block w-full aspect-[4/3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0d0d0d] focus:ring-[#e50914] ${isReflecting ? 'lightning-reflect' : ''}`}>
                                    <LazyImage src={work.imageUrl} alt={work.category} className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110" loadIndex={index}/>
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#e50914] transition-all duration-300 rounded-lg glow-shadow-sm"></div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };
    
    const VideoGrid: React.FC<{ videos: VideoWork[]; isReflecting: boolean }> = ({ videos, isReflecting }) => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map((video, index) => (
                <button
                    key={video.id}
                    onClick={() => {
                        openModal(videos, index);
                    }}
                    className={`image-sound-hover group relative overflow-hidden rounded-lg shadow-lg shadow-black/40 aspect-video focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0d0d0d] focus:ring-[#e50914] ${isReflecting ? 'lightning-reflect' : ''}`}
                >
                    <LazyImage src={video.thumbnailUrl!} alt={`Video thumbnail ${video.id}`} className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <PlayIcon className="w-16 h-16 text-white/80 transform scale-75 group-hover:scale-100 transition-transform duration-300" />
                    </div>
                     {video.mostViewed && (
                        <div className="absolute top-2 right-2 bg-[#e50914] text-white text-xs font-bold px-2 py-1 rounded-md glow-shadow">
                            MOST VIEWED
                        </div>
                    )}
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#e50914] transition-all duration-300 rounded-lg"></div>
                </button>
            ))}
        </div>
    );

    const renderVFX = () => {
        return (
            <div className="space-y-16">
                 <div className="flex justify-center gap-3 mb-10 p-1.5 bg-gray-900/50 rounded-full">
                    <button
                        onClick={() => setActiveVfxSubTab('anime')}
                        className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${activeVfxSubTab === 'anime' ? 'bg-red-600 text-white shadow-md shadow-red-500/20' : ' text-gray-400 hover:bg-gray-700/50 hover:text-white'}`}
                    >
                        Anime Edits
                    </button>
                    <button
                        onClick={() => setActiveVfxSubTab('vfxEdits')}
                        className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${activeVfxSubTab === 'vfxEdits' ? 'bg-red-600 text-white shadow-md shadow-red-500/20' : ' text-gray-400 hover:bg-gray-700/50 hover:text-white'}`}
                    >
                        Cinematic VFX
                    </button>
                </div>
                {activeVfxSubTab === 'anime' ? (
                    <div>
                        <h3 id="vfx-category-Anime-Edits" className="text-3xl font-bold mb-8 tracking-wide text-center text-white transition-all duration-300 scroll-mt-24">Anime Edits (YouTube)</h3>
                        <VideoGrid videos={ANIME_EDITS} isReflecting={isReflecting} />
                    </div>
                ) : (
                    <div>
                        <h3 id="vfx-category-Cinematic-VFX" className="text-3xl font-bold mb-8 tracking-wide text-center text-white transition-all duration-300 scroll-mt-24">Cinematic VFX</h3>
                        <div className="flex flex-wrap justify-center gap-8">
                           {VFX_EDITS.map(video => (
                                <VfxVideoPlayer 
                                    key={video.id} 
                                    video={video}
                                    isPlaying={playingVideoId === video.id}
                                    onPlayRequest={() => handlePlayRequest(video.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }
    
    return (
        <section ref={ref} id="portfolio" className="py-20 md:py-32 bg-black/30 backdrop-blur-sm">
            <div className={`container mx-auto px-6 transition-all duration-1000 ease-out ${animationClass}`}>
                <h2 ref={titleRef} className="text-4xl md:text-5xl font-bold text-center mb-12 text-white transition-all duration-300">My Portfolio</h2>
                <div className="flex justify-center gap-4 mb-12">
                    <button
                        onClick={() => setActiveTab('graphic')}
                        className={`text-xl font-semibold px-8 py-3 rounded-full transition-all duration-300 ${activeTab === 'graphic' ? 'bg-[#e50914] text-white glow-shadow' : 'bg-gray-800/50 text-gray-300 hover:bg-gray-800'}`}
                    >
                        Graphic Design
                    </button>
                    <button
                        onClick={() => setActiveTab('vfx')}
                        className={`text-xl font-semibold px-8 py-3 rounded-full transition-all duration-300 ${activeTab === 'vfx' ? 'bg-[#e50914] text-white glow-shadow' : 'bg-gray-800/50 text-gray-300 hover:bg-gray-800'}`}
                    >
                        Video Editing
                    </button>
                </div>
                <div>
                    {activeTab === 'graphic' ? renderGraphicDesign() : renderVFX()}
                </div>
            </div>
        </section>
    );
};