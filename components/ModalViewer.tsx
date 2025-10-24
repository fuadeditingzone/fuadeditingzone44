import React, { useEffect } from 'react';
import type { GraphicWork, VideoWork, ModalItem } from '../types';
import { LazyImage } from './LazyImage';
import { CloseIcon } from './Icons';

interface ModalViewerProps {
  state: { items: ModalItem[]; currentIndex: number };
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export const ModalViewer: React.FC<ModalViewerProps> = ({ state, onClose, onNext, onPrev }) => {
    const { items, currentIndex } = state;
    const currentItem = items[currentIndex];
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') onNext();
            if (e.key === 'ArrowLeft') onPrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, onNext, onPrev]);

    const isImage = (item: ModalItem): item is GraphicWork => 'imageUrl' in item;
    const isVideo = (item: ModalItem): item is VideoWork => 'url' in item;

    return (
        <div 
            className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div className="relative w-full h-full max-w-5xl max-h-[90vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
                {isImage(currentItem) ? (
                    <img src={currentItem.imageUrl} alt="Portfolio work" className="max-w-full max-h-full object-contain rounded-lg"/>
                ) : isVideo(currentItem) ? (
                    <iframe
                        src={currentItem.url}
                        title="Portfolio Video"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full aspect-video"
                    ></iframe>
                ) : null}
            </div>

            <button
                onClick={onClose}
                aria-label="Close viewer"
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-2 rounded-full bg-black/50 hover:bg-[#e50914]"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <button
                onClick={onPrev}
                aria-label="Previous item"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-2 rounded-full bg-black/50 hover:bg-[#e50914]"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            
            <button
                onClick={onNext}
                aria-label="Next item"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-2 rounded-full bg-black/50 hover:bg-[#e50914]"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    );
};


interface GalleryGridModalProps {
    items: GraphicWork[];
    onClose: () => void;
    onImageClick: (index: number) => void;
}

export const GalleryGridModal: React.FC<GalleryGridModalProps> = ({ items, onClose, onImageClick }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center animate-fade-in p-4 sm:p-8"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-gray-900/80 border border-gray-700 rounded-2xl w-full h-full max-w-7xl flex flex-col"
                style={{ animation: 'fade-in-scale 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-6 border-b border-gray-700/50 flex-shrink-0">
                    <h2 className="text-3xl font-bold font-poppins text-white">Works Gallery</h2>
                    <button
                        onClick={onClose}
                        aria-label="Close gallery"
                        className="text-white/70 hover:text-white transition-colors p-2 rounded-full bg-black/50 hover:bg-[#e50914]"
                    >
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {items.map((item, index) => (
                            <button 
                                key={item.id} 
                                onClick={() => onImageClick(index)}
                                className="image-sound-hover group relative overflow-hidden rounded-lg shadow-lg shadow-black/40 cursor-pointer block w-full aspect-square focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-[#e50914]"
                            >
                                <LazyImage 
                                    src={item.imageUrl} 
                                    alt={`Graphic work ${item.id}`} 
                                    className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                                    loadIndex={index}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#e50914] transition-all duration-300 rounded-lg"></div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};