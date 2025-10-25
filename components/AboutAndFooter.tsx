import React, { useRef, useEffect } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { siteConfig } from '../config';

interface AboutAndFooterProps {
    isReflecting: boolean;
}

export const AboutAndFooter: React.FC<AboutAndFooterProps> = ({ isReflecting }) => {
    const [ref, isVisible] = useIntersectionObserver({ threshold: 0.2, triggerOnce: true });
    const animationClass = isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10';
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
        <footer ref={ref} id="about" className={`bg-black/50 pt-16 pb-6 transition-all duration-1000 ease-out ${animationClass}`}>
            <div className="container mx-auto px-6 text-center">
                <div ref={parallaxRef}>
                    <h2 className="text-3xl font-bold text-white mb-4 transition-all duration-300">{siteConfig.content.about.title}</h2>
                    <p className="max-w-3xl mx-auto text-gray-400 mb-10">
                        {siteConfig.content.about.paragraph}
                    </p>
                </div>
                <div className="border-t border-gray-800 pt-6 text-gray-500">
                    <p>&copy; {new Date().getFullYear()} Designed & Developed by {siteConfig.branding.name}</p>
                </div>
            </div>
        </footer>
    );
};