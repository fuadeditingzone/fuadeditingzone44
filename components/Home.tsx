
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { ALL_SERVICES } from '../constants';
import type { Service } from '../types';
import { CrystalStarIcon, ThreeDotsIcon, ChevronDownIcon } from './Icons';

const ServiceButtonWithTooltip: React.FC<{ service: Service }> = ({ service }) => (
    <div className="relative group flex items-center">
        <div className="flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white cursor-default">
            {service.hasBadge && <CrystalStarIcon className="w-3.5 h-3.5 text-white" />}
            <span>{service.name}</span>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-60 p-3 bg-gray-900 border border-gray-700 rounded-lg text-center text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none transform translate-y-2 group-hover:translate-y-0">
            {service.description}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-gray-700"></div>
        </div>
    </div>
);

export const ServicesPopup: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const graphicServices = useMemo(() => ALL_SERVICES.filter(s => s.category === 'Graphic Design'), []);
    const videoServices = useMemo(() => ALL_SERVICES.filter(s => s.category === 'Video Editing'), []);
    const [expandedService, setExpandedService] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<'all' | 'Graphic Design' | 'Video Editing'>('all');

    const handleToggleService = (serviceName: string) => {
        setExpandedService(prev => (prev === serviceName ? null : serviceName));
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const ServiceItem: React.FC<{ service: Service }> = ({ service }) => {
        const isExpanded = expandedService === service.name;
        const ServiceIcon = service.icon;

        return (
            <div className="border-b border-white/5 last:border-b-0">
                <button
                    onClick={() => handleToggleService(service.name)}
                    className="flex items-center justify-between gap-3 text-left text-gray-300 hover:text-white transition-colors w-full p-3 rounded-md hover:bg-white/5"
                >
                    <span className="flex items-center gap-3">
                        {ServiceIcon && <ServiceIcon className="w-6 h-6 text-red-500/90 flex-shrink-0" />}
                        <span className="font-medium">{service.name}</span>
                        {service.hasBadge && <CrystalStarIcon className="w-4 h-4 text-white flex-shrink-0 ml-1" title="Main Service"/>}
                    </span>
                    <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
                <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                        <p className="pt-1 pb-3 pl-12 pr-6 text-sm text-gray-400">
                            {service.description}
                        </p>
                    </div>
                </div>
            </div>
        );
    };
    
    const FilterButton: React.FC<{ category: 'all' | 'Graphic Design' | 'Video Editing', label: string }> = ({ category, label }) => (
        <button
            onClick={() => setActiveFilter(category)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 ${activeFilter === category ? 'bg-red-600 text-white shadow-md shadow-red-500/20' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <div
                className={`relative bg-gray-900/50 border border-gray-700 rounded-2xl w-full mx-4 overflow-hidden transition-all duration-500 ${activeFilter === 'all' ? 'max-w-4xl' : 'max-w-md'}`}
                style={{ animation: 'fade-in-scale 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                        className="bg-red-500/30 rounded-full"
                        style={{ width: '1px', height: '1px', animation: 'shockwave 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards', boxShadow: '0 0 20px 10px rgba(229, 9, 20, 0.3)' }}
                    />
                </div>
                <div className="absolute inset-0 bg-no-repeat opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(ellipse at 50% 50%, rgba(229, 9, 20, 0.25) 0%, transparent 70%)' }} />

                <div className="relative p-6 max-h-[80vh] overflow-y-auto">
                    <div className="flex flex-col items-center gap-2 mb-6">
                        <h2 className="text-2xl font-bold font-poppins text-white">All Services</h2>
                        <div className="flex justify-center items-center gap-3 p-1 bg-gray-900/50 rounded-full">
                            <FilterButton category="all" label="All" />
                            <FilterButton category="Graphic Design" label="Graphic Design" />
                            <FilterButton category="Video Editing" label="Video Editing" />
                        </div>
                    </div>
                    
                    <div className={`grid gap-x-6 transition-all duration-500 ${activeFilter === 'all' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                        {(activeFilter === 'all' || activeFilter === 'Graphic Design') && (
                            <div className="p-4">
                                <h3 className="font-poppins text-xl font-bold mb-4 border-b border-gray-700 pb-2 text-white">Graphic Design</h3>
                                <div className="flex flex-col">
                                    {graphicServices.map(service => <ServiceItem key={service.name} service={service} />)}
                                </div>
                            </div>
                        )}
                         {(activeFilter === 'all' || activeFilter === 'Video Editing') && (
                            <div className="p-4">
                                <h3 className="font-poppins text-xl font-bold mb-4 border-b border-gray-700 pb-2 text-white">Video Editing</h3>
                                <div className="flex flex-col">
                                    {videoServices.map(service => <ServiceItem key={service.name} service={service} />)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface HomeProps {
    onScrollTo: (section: 'portfolio' | 'contact') => void;
    onOrderNowClick: () => void;
    isReflecting: boolean;
    onServicesClick: () => void;
}

export const Home: React.FC<HomeProps> = ({ onScrollTo, onOrderNowClick, isReflecting, onServicesClick }) => {
    const [ref, isVisible] = useIntersectionObserver({ threshold: 0.3, triggerOnce: true });
    const mainServices = useMemo(() => ALL_SERVICES.filter(s => s.isMain), []);
    const parallaxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = parallaxRef.current;
        if (!el) return;
        el.style.transition = 'transform 0.2s ease-out';
        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            const x = (clientX / window.innerWidth - 0.5) * -20;
            const y = (clientY / window.innerHeight - 0.5) * -20;
            el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const animationClass = isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10';

    return (
        <section ref={ref} id="home" className="min-h-screen flex items-center justify-center bg-transparent">
            <div className="w-full text-center px-4" style={{ animation: 'main-content-appear 1s ease-out forwards' }}>
                <div ref={parallaxRef} className={`transition-all duration-1000 ease-out ${animationClass}`}>
                    <h1 className="text-3xl md:text-6xl font-bold font-poppins text-white tracking-tight transition-all duration-300">Graphic Designer & VFX Editor</h1>
                    <p className="max-w-2xl mx-auto mt-6 text-base md:text-lg text-gray-300 font-inter">
                        I turn concepts into clear, powerful visuals. Specializing in photo manipulation, banners, thumbnails & cinematic VFX edits.
                    </p>
                    <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
                        <button onClick={() => onScrollTo('portfolio')} className="btn-glow bg-[#e50914] text-white font-bold py-3 px-8 rounded-full transition-all duration-300 hover:bg-red-700 transform hover:scale-105">
                            View Portfolio
                        </button>
                        <button onClick={onOrderNowClick} className="btn-glow border-2 border-[#e50914] text-white font-bold py-3 px-8 rounded-full transition-all duration-300 hover:bg-[#e50914] transform hover:scale-105">
                            Order Now
                        </button>
                    </div>
                    <div className="mt-8 flex justify-center items-center gap-4 sm:gap-6 flex-wrap">
                        {mainServices.map(service => (
                            <ServiceButtonWithTooltip key={service.name} service={service} />
                        ))}
                        <button
                            onClick={onServicesClick}
                            className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                            aria-label="View all services"
                        >
                            <ThreeDotsIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};
