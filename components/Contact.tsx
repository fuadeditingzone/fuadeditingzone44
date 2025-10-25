

import React, { useRef, useEffect } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { SOCIAL_LINKS } from '../constants';
import { EmailIcon } from './Icons';

interface ContactProps {
  onEmailClick: () => void;
  isReflecting: boolean;
}

export const Contact: React.FC<ContactProps> = ({ onEmailClick, isReflecting }) => {
    const [ref, isVisible] = useIntersectionObserver({ threshold: 0.3, triggerOnce: true });
    const animationClass = isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10';
    const email = 'fuadeditingzone@gmail.com';
    const parallaxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = parallaxRef.current;
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

    return (
        <section ref={ref} id="contact" className="py-20 md:py-32 bg-transparent">
            <div className={`container mx-auto px-6 text-center transition-all duration-1000 ease-out ${animationClass}`}>
                <div ref={parallaxRef}>
                    <h2 className="text-4xl md:text-5xl font-bold text-white transition-all duration-300">Let's Connect</h2>
                    <p className="text-lg text-gray-300 mt-4 mb-8">Let’s work together — reach out anytime.</p>
                </div>
                <div className="flex flex-col items-center gap-8">
                    <button
                        onClick={onEmailClick}
                        className="group flex items-center gap-3 bg-gray-900/50 border-2 border-gray-700 px-6 py-3 rounded-full transition-all duration-300 hover:border-[#e50914] hover:scale-105 btn-glow"
                    >
                        <EmailIcon className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
                        <span className="font-semibold text-gray-300 group-hover:text-white transition-colors">{email}</span>
                    </button>
                    <div className="flex justify-center items-center gap-6 flex-wrap">
                        {SOCIAL_LINKS.map(link => (
                            <a 
                                key={link.name} 
                                href={link.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                aria-label={link.name}
                                className={`group relative w-14 h-14 flex items-center justify-center bg-gray-900/50 border-2 border-gray-700 rounded-full transition-all duration-300 transform-gpu hover:border-[#e50914] hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-[#e50914] ${isReflecting ? 'lightning-reflect' : ''}`}
                            >
                                <div className="absolute inset-0 rounded-full bg-black/30" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5), 0 4px 6px rgba(0,0,0,0.4)' }}></div>
                                <div className="absolute inset-0 rounded-full overflow-hidden social-icon-shine"></div>
                                <div className="pulse-on-hover rounded-full" />
                                <link.icon className="relative z-10 text-2xl text-white transition-colors duration-300" />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};