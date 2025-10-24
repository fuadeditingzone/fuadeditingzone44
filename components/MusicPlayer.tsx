import React, { useState, useEffect, useRef } from 'react';
import { PlayIcon, PauseIcon, CloseIcon } from './Icons';

interface MusicPlayerProps {
    track: { title: string; artist: string; url: string };
    onClose: () => void;
    audioRef: React.MutableRefObject<HTMLAudioElement | null>;
}

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
};

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ track, onClose, audioRef }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        const audio = new Audio(track.url);
        audio.volume = 0.5;
        audioRef.current = audio;

        const setAudioData = () => {
            setDuration(audio.duration);
            setCurrentTime(audio.currentTime);
        };
        const setAudioTime = () => setCurrentTime(audio.currentTime);
        const setAudioProgress = () => setProgress((audio.currentTime / audio.duration) * 100);
        
        audio.addEventListener('loadeddata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('timeupdate', setAudioProgress);

        audio.play().then(() => setIsPlaying(true)).catch(error => {
            if ((error as DOMException).name !== 'AbortError') {
                console.error("Music playback error:", error);
            }
        });

        return () => {
            audio.pause();
            audio.removeEventListener('loadeddata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('timeupdate', setAudioProgress);
        };
    }, [track, audioRef]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(error => {
                if ((error as DOMException).name !== 'AbortError') {
                    console.error("Music playback error:", error);
                }
            });
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef.current || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const newProgress = (e.clientX - rect.left) / rect.width;
        audioRef.current.currentTime = newProgress * duration;
        setProgress(newProgress * 100);
    };

    return (
        <div className="fixed bottom-24 right-4 sm:right-6 z-[76] w-72 bg-gray-900/80 backdrop-blur-lg border border-gray-700 rounded-lg shadow-2xl shadow-black/50 p-3"
             style={{ animation: 'futuristic-appear 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}>
            <div className="flex items-center gap-3">
                <button onClick={togglePlay} className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-red-600 text-white rounded-full btn-glow">
                    {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                </button>
                <div className="flex-grow overflow-hidden">
                    <p className="text-sm font-semibold text-white truncate">{track.title}</p>
                    <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white flex-shrink-0">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="mt-2">
                <div onClick={handleSeek} className="w-full h-1.5 bg-gray-700 rounded-full cursor-pointer">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>
        </div>
    );
};