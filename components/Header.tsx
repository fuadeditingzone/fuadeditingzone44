import React, { useState, useEffect, useCallback } from 'react';
import { LOGO_URL, PROFILE_PIC_URL } from '../constants';

interface HeaderProps {
  onScrollTo: (section: 'home' | 'portfolio' | 'contact' | 'about') => void;
  onProfileClick: () => void;
  isReflecting: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onScrollTo, onProfileClick, isReflecting }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoAnimating, setIsLogoAnimating] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const triggerLogoAnimation = useCallback(() => {
    if (isLogoAnimating) return;
    setIsLogoAnimating(true);
    setTimeout(() => setIsLogoAnimating(false), 600);
  }, [isLogoAnimating]);

  useEffect(() => {
    const intervalId = setInterval(triggerLogoAnimation, 4000);
    return () => clearInterval(intervalId);
  }, [triggerLogoAnimation]);

  const handleLogoClick = () => {
    triggerLogoAnimation();
    onScrollTo('home');
  };

  type NavLinkProps = {
    section: 'home' | 'portfolio' | 'contact' | 'about', 
    children: React.ReactNode 
  };

  const NavLink: React.FC<NavLinkProps> = ({ section, children }) => (
    <button
      onClick={() => {
          onScrollTo(section);
          setIsMenuOpen(false);
      }}
      className="text-3d text-gray-300 hover:text-white transition-all duration-300 text-lg relative after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:w-0 after:h-[2px] after:bg-[#e50914] after:transition-all after:duration-300 hover:after:w-full"
    >
      {children}
    </button>
  );

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-black/80 backdrop-blur-sm shadow-lg shadow-black/20' : 'bg-transparent'}`}>
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <button
            onClick={handleLogoClick}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-white rounded-sm relative flex items-center gap-3"
            aria-label="Fuad Editing Zone Logo - Go to top"
            data-no-hover-sound="true"
        >
            <img
                src={LOGO_URL}
                alt="Fuad Editing Zone Logo"
                className={`h-16 w-auto transition-all duration-300 ${isScrolled ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]' : ''} ${isLogoAnimating ? 'animate-logo-spin' : ''}`}
            />
            <span className={`text-3d hidden sm:block font-poppins text-xl font-bold text-white transition-all duration-300 ${isScrolled ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''}`}>
                Fuad Editing Zone
            </span>
        </button>
        <div className="flex items-center">
            <div className="hidden md:flex items-center space-x-8">
              <NavLink section="home">Home</NavLink>
              <NavLink section="portfolio">Portfolio</NavLink>
              <NavLink section="about">About</NavLink>
              <NavLink section="contact">Contact</NavLink>
            </div>
            
            <button onClick={onProfileClick} className="ml-6 flex-shrink-0" aria-label="View Profile">
                <img src={PROFILE_PIC_URL} alt="Fuad Ahmed Profile" className="w-12 h-12 rounded-full border-2 border-gray-600 hover:border-red-500 transition-all duration-300 glow-shadow-sm transform hover:scale-110" />
            </button>
            <div className="md:hidden ml-4">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`text-white focus:outline-none transition-transform duration-300 ${isMenuOpen ? 'scale-110' : ''}`}>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
                    </svg>
                </button>
            </div>
        </div>
      </nav>
      {isMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-sm flex flex-col items-center space-y-6 py-8">
            <NavLink section="home">Home</NavLink>
            <NavLink section="portfolio">Portfolio</NavLink>
            <NavLink section="about">About</NavLink>
            <NavLink section="contact">Contact</NavLink>
            <button
              onClick={() => {
                onProfileClick();
                setIsMenuOpen(false);
              }}
              className="text-gray-300 hover:text-white transition-colors duration-300 text-lg"
            >
              My Profile
            </button>
          </div>
      )}
    </header>
  );
};