import React, { useRef, useEffect, useState } from 'react';
import { ALL_SERVICES } from '../constants';
import type { Service } from '../types';
import { GalleryIcon, PhotoManipulationIcon, ThumbnailIcon, VfxIcon, CloseIcon } from './Icons';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onQuickAction: (service: Service) => void;
  onGalleryOpen: () => void;
  chatButtonRect: DOMRect | null;
}

const mainServices = ALL_SERVICES.filter(s => s.isMain);

const getServiceIcon = (serviceName: string) => {
    if (serviceName.includes('Photo')) return <PhotoManipulationIcon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-red-400 transition-colors" />;
    if (serviceName.includes('Thumbnails')) return <ThumbnailIcon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-red-400 transition-colors" />;
    if (serviceName.includes('VFX')) return <VfxIcon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-red-400 transition-colors" />;
    return null;
};

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, onQuickAction, onGalleryOpen, chatButtonRect }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x, y, opacity: 0 });

    useEffect(() => {
        if (menuRef.current) {
            const { innerWidth, innerHeight } = window;
            const { offsetWidth, offsetHeight } = menuRef.current;
            let newX = x;
            let newY = y;
            if (x + offsetWidth > innerWidth - 10) {
                newX = x - offsetWidth;
            }
            if (y + offsetHeight > innerHeight - 10) {
                newY = y - offsetHeight;
            }
            // Avoid chat button overlap
            if (chatButtonRect) {
                const collides = (
                    newX < chatButtonRect.right &&
                    newX + offsetWidth > chatButtonRect.left &&
                    newY < chatButtonRect.bottom &&
                    newY + offsetHeight > chatButtonRect.top
                );
                if(collides) {
                    newY = chatButtonRect.top - offsetHeight - 10;
                    // Re-check window boundary after moving
                     if (newY < 10) {
                        newY = chatButtonRect.bottom + 10;
                    }
                    if (newX + offsetWidth > innerWidth - 10) {
                        newX = chatButtonRect.left - offsetWidth - 10;
                    }
                }
            }
            setPosition({ x: newX, y: newY, opacity: 1 });
        }
    }, [x, y, chatButtonRect]);

    return (
        <div
            ref={menuRef}
            className="fixed z-[9999] w-64 bg-gray-900/80 backdrop-blur-lg border border-gray-700 rounded-lg shadow-2xl shadow-black/50 overflow-hidden"
            style={{ 
                top: `${position.y}px`, 
                left: `${position.x}px`,
                opacity: position.opacity,
                animation: 'fade-in-scale 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
            onClick={e => e.stopPropagation()}
            onContextMenu={e => {
                e.preventDefault();
                onClose();
            }}
        >
            <div className="p-2 space-y-1">
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Quick Actions</div>
                {mainServices.map(service => (
                    <button
                        key={service.name}
                        onClick={() => onQuickAction(service)}
                        className="group w-full flex items-center text-left px-3 py-2 text-sm text-gray-200 rounded-md hover:bg-red-500/20 hover:text-white transition-all duration-200"
                    >
                        {getServiceIcon(service.name)}
                        <span>{service.name === 'VFX' ? 'Cinematic VFX' : service.name.split('/')[0]}</span>
                    </button>
                ))}
                <button
                    onClick={onGalleryOpen}
                    className="group w-full flex items-center text-left px-3 py-2 text-sm text-gray-200 rounded-md hover:bg-red-500/20 hover:text-white transition-all duration-200"
                >
                    <GalleryIcon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-red-400 transition-colors" />
                    <span>View Works Gallery</span>
                </button>
            </div>
            <div className="border-t border-gray-700/50 p-2">
                 <button
                    onClick={onClose}
                    className="group w-full flex items-center text-left px-3 py-2 text-sm text-gray-400 rounded-md hover:bg-white/10 hover:text-gray-200 transition-all duration-200"
                >
                    <CloseIcon className="w-5 h-5 mr-3 text-gray-500 group-hover:text-gray-400 transition-colors" />
                    <span>Close Menu</span>
                </button>
            </div>
        </div>
    );
};