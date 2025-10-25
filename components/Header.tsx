import React, { useState, useEffect, useCallback, useRef } from 'react';
import { siteConfig } from '../config';
import { useUser } from '../contexts/UserContext';
import type { User } from '../types';
import { ProfileMenu } from './ProfileMenu';
import { UploadIcon, BriefcaseIcon, UsersIcon } from './Icons';

interface HeaderProps {
  onScrollTo: (section: 'home' | 'portfolio' | 'contact' | 'about') => void;
  onLoginClick: () => void;
  onViewProfile: (user: User) => void;
  onEditProfile: () => void;
  onSearch: (query: string) => void;
  isReflecting: boolean;
  onUploadClick: () => void;
  onPostJobClick: () => void;
  onExploreClick: () => void;
  onJobsClick: () => void;
  onCommunityClick: () => void;
}

export const Header: React.FC<HeaderProps> = (props) => {
  const { onScrollTo, onLoginClick, onViewProfile, onEditProfile, onSearch, isReflecting, onUploadClick, onPostJobClick, onExploreClick, onJobsClick, onCommunityClick } = props;
  const { currentUser, logout, rtdbName } = useUser();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoAnimating, setIsLogoAnimating] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const marketplaceEnabled = siteConfig.features.marketplace.enabled;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isSearchOpen]);
  
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const NavLink: React.FC<{ onClick: () => void, children: React.ReactNode }> = ({ onClick, children }) => (
    <button
      onClick={() => {
          onClick();
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
            aria-label={`${siteConfig.branding.name} Logo - Go to top`}
            data-no-hover-sound="true"
        >
            <img src={siteConfig.branding.logoUrl} alt={`${siteConfig.branding.name} Logo`} className={`h-16 w-auto transition-all duration-300 ${isScrolled ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]' : ''} ${isLogoAnimating ? 'animate-logo-spin' : ''}`} />
            <span className={`text-3d hidden sm:block font-poppins text-xl font-bold text-white transition-all duration-300 ${isScrolled ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''}`}>{siteConfig.branding.name}</span>
        </button>
        <div className="flex items-center">
            <div className="hidden md:flex items-center space-x-8">
              {marketplaceEnabled && <NavLink onClick={onExploreClick}>Explore</NavLink>}
              {marketplaceEnabled && <NavLink onClick={onJobsClick}>Jobs</NavLink>}
              {marketplaceEnabled && <NavLink onClick={onCommunityClick}>Community</NavLink>}
              <NavLink onClick={() => onScrollTo('portfolio')}>Portfolio</NavLink>
              <NavLink onClick={() => onScrollTo('about')}>About</NavLink>
            </div>
            
            <div className="flex items-center gap-4 ml-4">
              <div className="relative">
                <button onClick={() => setIsSearchOpen(prev => !prev)} className="text-gray-300 hover:text-white transition-colors" aria-label="Search users">
                  <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                </button>
                {isSearchOpen && (
                  <form onSubmit={handleSearchSubmit} className="absolute top-full right-0 mt-2 animate-fade-in">
                    <input
                      ref={searchRef}
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search username..."
                      className="bg-gray-800 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all w-48"
                      onBlur={() => { if(!searchQuery) setIsSearchOpen(false); }}
                    />
                  </form>
                )}
              </div>
              
              {currentUser ? (
                <>
                  <div className="hidden lg:block text-right">
                    <p className="font-bold text-white text-sm truncate">{currentUser.name}</p>
                    <p className="text-gray-400 text-xs truncate">{currentUser.email}</p>
                    {rtdbName && <p id="db-display-name" className="text-green-400 text-xs italic">DB: {rtdbName}</p>}
                  </div>

                  <div className="relative">
                    <button onClick={() => setIsProfileMenuOpen(p => !p)} className="flex-shrink-0" aria-label="Open profile menu">
                      <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center border-2 border-gray-600 hover:border-red-500 transition-all duration-300 glow-shadow-sm transform hover:scale-110 overflow-hidden">
                        {currentUser.avatarUrl ? (
                          <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-red-600 flex items-center justify-center">
                            <span className="text-xl font-bold text-white">{currentUser.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                    </button>
                    {isProfileMenuOpen && (
                      <ProfileMenu 
                        onClose={() => setIsProfileMenuOpen(false)}
                        onLogout={logout}
                        onViewProfile={() => onViewProfile(currentUser)}
                        onEditProfile={onEditProfile}
                      />
                    )}
                  </div>
                </>
              ) : (
                <button onClick={onLoginClick} className="hidden md:block bg-red-600 text-white font-bold py-2 px-5 rounded-full transition-all duration-300 hover:bg-red-700 transform hover:scale-105 btn-glow">
                    Login
                </button>
              )}
            </div>

            <div className="md:hidden ml-4">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`text-white focus:outline-none transition-transform duration-300 ${isMenuOpen ? 'scale-110' : ''}`}>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} /></svg>
                </button>
            </div>
        </div>
      </nav>
      {isMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-sm flex flex-col items-center space-y-6 py-8">
            {marketplaceEnabled && <NavLink onClick={onExploreClick}>Explore</NavLink>}
            {marketplaceEnabled && <NavLink onClick={onJobsClick}>Jobs</NavLink>}
            {marketplaceEnabled && <NavLink onClick={onCommunityClick}>Community</NavLink>}
            <NavLink onClick={() => onScrollTo('portfolio')}>Portfolio</NavLink>
            <NavLink onClick={() => onScrollTo('about')}>About</NavLink>
            {!currentUser && (
              <button onClick={() => { onLoginClick(); setIsMenuOpen(false); }} className="text-gray-300 hover:text-white transition-colors duration-300 text-lg">Login</button>
            )}
          </div>
      )}
    </header>
  );
};