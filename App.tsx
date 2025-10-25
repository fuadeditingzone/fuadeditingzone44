import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { GraphicWork, VideoWork, Service, PortfolioTab, VfxSubTab, ModalItem, User, Post, Job } from './types';
import { siteConfig } from './config';
import { UserProvider, useUser } from './contexts/UserContext';
import { MarketplaceProvider } from './contexts/MarketplaceContext';

import { CustomCursor } from './components/CustomCursor';
import { StormyVFXBackground } from './components/StormyVFXBackground';
import { Header } from './components/Header';
import { Home, ServicesPopup } from './components/Home';
import { Portfolio } from './components/Portfolio';
import { Contact } from './components/Contact';
import { AboutAndFooter } from './components/AboutAndFooter';
import { ModalViewer, GalleryGridModal } from './components/ModalViewer';
import { ProfileModal } from './components/ProfileModal';
import { EditProfileModal } from './components/EditProfileModal';
import { OrderModal } from './components/OrderModal';
import { ContextMenu } from './components/ContextMenu';
import { LoginModal } from './components/LoginModal';
import { SearchResultsModal } from './components/SearchResultsModal';
import { WelcomeScreen } from './components/WelcomeScreen';
// New Marketplace Components
import { ExploreModal } from './components/ExploreModal';
import { JobsModal } from './components/JobsModal';
import { UploadModal } from './components/UploadModal';
import { PostJobModal } from './components/PostJobModal';
import { JobDetailsModal } from './components/JobDetailsModal';
import { CommunityModal } from './components/CommunityModal';

const safePlay = (mediaPromise: Promise<void> | undefined) => {
    if (mediaPromise !== undefined) {
        mediaPromise.catch(error => {
            if ((error as DOMException).name !== 'AbortError') {
                console.error("Media playback failed:", error);
            }
        });
    }
};

type AppState = 'welcome' | 'entered';

const AppContent = () => {
  const { currentUser, isLocked, lockSite, unlockSite, findUsers, getUserByUsername } = useUser();
  const [appState, setAppState] = useState<AppState>('welcome');
  const [isVfxVideoPlaying, setIsVfxVideoPlaying] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [isParallaxActive] = useState(true);

  // Modal States
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSearchResultsModalOpen, setIsSearchResultsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  
  // Marketplace & Community Modal States
  const [isExploreModalOpen, setIsExploreModalOpen] = useState(false);
  const [isJobsModalOpen, setIsJobsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);
  const [viewingJob, setViewingJob] = useState<Job | null>(null);
  const [viewingPost, setViewingPost] = useState<Post | null>(null);


  const sections = { home: useRef<HTMLDivElement>(null), portfolio: useRef<HTMLDivElement>(null), contact: useRef<HTMLDivElement>(null), about: useRef<HTMLDivElement>(null) };
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isGalleryGridOpen, setIsGalleryGridOpen] = useState(false);
  const [singleImageViewerState, setSingleImageViewerState] = useState<{ items: GraphicWork[]; currentIndex: number } | null>(null);
  const [activePortfolioTab, setActivePortfolioTab] = useState<PortfolioTab>('graphic');
  const [activeVfxSubTab, setActiveVfxSubTab] = useState<VfxSubTab>('anime');
  const audioRefs = useRef<Record<keyof typeof siteConfig.audio.sources, HTMLAudioElement | null>>({ background: null, hover: null, click: null, profileClick: null, navClick: null, imageHover1: null, imageHover2: null, mouseMove: null, storm: null, welcomeExit: null });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const canPlayMoveSound = useRef(true);
  const lastMousePosition = useRef({ x: 0, y: 0, time: Date.now() });
  const isStormSoundPlaying = useRef(false);
  const stormSoundFadeInterval = useRef<number | null>(null);
  
  const profileSfxRef = useRef<HTMLAudioElement | null>(null);

  const unlockAudio = useCallback(() => {
    if (audioUnlocked) return;
    console.log("Unlocking audio due to user interaction.");
    const backgroundAudio = audioRefs.current.background;
    if (backgroundAudio) safePlay(backgroundAudio.play());
    setAudioUnlocked(true);
  }, [audioUnlocked]);

  const handleEnter = useCallback(() => {
    if (audioUnlocked) safePlay(audioRefs.current.welcomeExit?.play());
    setAppState('entered');
    document.body.classList.remove('state-welcome');
    document.body.classList.add('state-entered');
  }, [audioUnlocked]);
  
  // Effect to set up SEO meta tags from config
  useEffect(() => {
    document.title = siteConfig.seo.title;
    
    const setMeta = (name: string, content: string) => {
      let element = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.name = name;
        document.head.appendChild(element);
      }
      element.content = content;
    };
    
    const setProperty = (property: string, content: string) => {
        let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
        if (!element) {
            element = document.createElement('meta');
            element.setAttribute('property', property);
            document.head.appendChild(element);
        }
        element.content = content;
    };
    
    setMeta('description', siteConfig.seo.description);
    setMeta('keywords', siteConfig.seo.keywords);
    setMeta('author', siteConfig.branding.author);

    // Open Graph / Facebook
    setProperty('og:type', 'website');
    setProperty('og:url', siteConfig.seo.url);
    setProperty('og:title', siteConfig.seo.title);
    setProperty('og:description', siteConfig.seo.description);
    setProperty('og:image', siteConfig.seo.ogImage);

    // Twitter
    setMeta('twitter:card', 'summary_large_image');
    setProperty('twitter:url', siteConfig.seo.url);
    setMeta('twitter:title', siteConfig.seo.title);
    setMeta('twitter:description', siteConfig.seo.description);
    setMeta('twitter:image', siteConfig.seo.ogImage);

  }, []);

  useEffect(() => {
      document.body.classList.add('state-welcome');
  }, []);

  useEffect(() => {
    if (currentUser || isLocked || appState !== 'entered') return;
    const timer = setTimeout(() => { lockSite(); setIsLoginModalOpen(true); }, 10 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [currentUser, isLocked, lockSite, appState]);
  
  const handleProfileModalClose = useCallback(() => {
    setIsProfileModalOpen(false);
    setViewingUser(null);
  }, []);

  const viewProfile = useCallback((user: User) => {
      setViewingUser(user);
      setIsSearchResultsModalOpen(false);
      setIsProfileModalOpen(true);
  }, []);
  
  const viewProfileByUsername = useCallback(async (username: string) => {
    const user = await getUserByUsername(username);
    if (user) {
        setIsExploreModalOpen(false);
        setIsJobsModalOpen(false);
        setIsCommunityModalOpen(false);
        if(viewingJob) setViewingJob(null);
        viewProfile(user);
    }
  }, [getUserByUsername, viewProfile, viewingJob]);

  const handleSearch = async (query: string) => {
      const results = await findUsers(query);
      setSearchResults(results);
      setIsSearchResultsModalOpen(true);
  };
  
  const handleLoginModalClose = useCallback(() => {
    setIsLoginModalOpen(false);
    if (isLocked) unlockSite();
  }, [isLocked, unlockSite]);

  const scrollToSection = useCallback((section: keyof typeof sections) => {
    const sectionElement = sections[section].current;
    if (sectionElement) {
        if(audioUnlocked) safePlay(audioRefs.current.navClick?.play());
        sectionElement.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sections, audioUnlocked]);

  useEffect(() => { 
    Object.entries(siteConfig.audio.sources).forEach(([key, config]) => { const audio = new Audio(config.src); audio.volume = config.volume; if (config.loop) audio.loop = true; audio.preload = 'auto'; audio.load(); audioRefs.current[key as keyof typeof siteConfig.audio.sources] = audio; }); 
    const sfxAudio = new Audio(siteConfig.audio.profileCreationSound); sfxAudio.volume = 0.7; profileSfxRef.current = sfxAudio;
  }, []);
  
  useEffect(() => {
    const handleMouseOver = (event: MouseEvent) => {
        if (!audioUnlocked) return;
        const target = event.target as HTMLElement;
        if (target.closest('[data-no-hover-sound="true"]')) return;
        if (target.closest('.image-sound-hover')) {
          const sounds = [audioRefs.current.imageHover1, audioRefs.current.imageHover2];
          safePlay(sounds[Math.floor(Math.random() * sounds.length)]?.play());
          return;
        }
        if (target.closest('button, a')) safePlay(audioRefs.current.hover?.play());
    };
    document.addEventListener('mouseover', handleMouseOver);
    return () => document.removeEventListener('mouseover', handleMouseOver);
  }, [audioUnlocked]);
  
  const handleMovement = useCallback((clientX: number, clientY: number) => {
      const now = Date.now(); const timeDelta = now - lastMousePosition.current.time; if (timeDelta < 10) return;
      lastMousePosition.current = { x: clientX, y: clientY, time: now };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        handleMovement(e.clientX, e.clientY);
        const canvas = canvasRef.current; const ctx = canvas?.getContext('2d'); if (!audioUnlocked || !ctx) return;
        const now = Date.now(); const timeDelta = now - lastMousePosition.current.time;
        if (timeDelta > 20) {
            const distance = Math.sqrt(Math.pow(e.clientX - lastMousePosition.current.x, 2) + Math.pow(e.clientY - lastMousePosition.current.y, 2));
            const speed = distance / timeDelta;
            if (speed > 5) { ctx.beginPath(); ctx.moveTo(lastMousePosition.current.x, lastMousePosition.current.y); ctx.lineTo(e.clientX, e.clientY); ctx.strokeStyle = 'white'; ctx.lineWidth = Math.min(8, 2 + speed / 3); ctx.lineCap = 'round'; ctx.shadowColor = '#e50914'; ctx.shadowBlur = 25; ctx.stroke(); ctx.shadowBlur = 0; }
            if (speed > 3 && !isStormSoundPlaying.current) {
                const stormAudio = audioRefs.current.storm;
                if (stormAudio) {
                    isStormSoundPlaying.current = true; stormAudio.currentTime = 0; stormAudio.volume = siteConfig.audio.sources.storm.volume; safePlay(stormAudio.play());
                    setTimeout(() => {
                        if (stormSoundFadeInterval.current) clearInterval(stormSoundFadeInterval.current);
                        const fadeDuration = 1000; const fadeSteps = 20; const volumeStep = siteConfig.audio.sources.storm.volume / fadeSteps;
                        stormSoundFadeInterval.current = window.setInterval(() => {
                            if (stormAudio.volume > volumeStep) stormAudio.volume -= volumeStep;
                            else { if (stormSoundFadeInterval.current) clearInterval(stormSoundFadeInterval.current); stormAudio.pause(); stormAudio.volume = siteConfig.audio.sources.storm.volume; isStormSoundPlaying.current = false; }
                        }, fadeDuration / fadeSteps);
                    }, 5000);
                }
            }
        }
        if (canPlayMoveSound.current) { safePlay(audioRefs.current.mouseMove?.play()); canPlayMoveSound.current = false; setTimeout(() => { canPlayMoveSound.current = true; }, 150); }
    };
    const handleTouchMove = (e: TouchEvent) => { if (e.touches.length > 0) handleMovement(e.touches[0].clientX, e.touches[0].clientY); };
    window.addEventListener('mousemove', handleMouseMove); window.addEventListener('touchmove', handleTouchMove);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('touchmove', handleTouchMove); };
  }, [handleMovement, audioUnlocked]);
  
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
    const setCanvasSize = () => {
        const dpr = window.devicePixelRatio || 1; canvas.width = window.innerWidth * dpr; canvas.height = window.innerHeight * dpr;
        canvas.style.width = `${window.innerWidth}px`; canvas.style.height = `${window.innerHeight}px`; ctx.scale(dpr, dpr);
    };
    setCanvasSize(); window.addEventListener('resize', setCanvasSize);
    let animationFrameId: number; const animate = () => { ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'; ctx.fillRect(0, 0, window.innerWidth, window.innerHeight); animationFrameId = requestAnimationFrame(animate); };
    animate(); return () => { window.removeEventListener('resize', setCanvasSize); cancelAnimationFrame(animationFrameId); };
  }, []);
  
  const [modalState, setModalState] = useState<{ items: ModalItem[]; currentIndex: number } | null>(null);
  const [orderModalState, setOrderModalState] = useState<{ isOpen: boolean; mode: 'whatsapp' | 'email' } | null>(null);
  const [isReflecting, setIsReflecting] = useState(false);
  const reflectTimeoutRef = useRef<number | null>(null);
  const triggerLightningReflection = useCallback(() => { if (reflectTimeoutRef.current) clearTimeout(reflectTimeoutRef.current); setIsReflecting(true); reflectTimeoutRef.current = window.setTimeout(() => setIsReflecting(false), 400); }, []);
  const openModal = useCallback((items: ModalItem[], startIndex: number) => { setModalState({ items, currentIndex: startIndex }); }, []);
  const closeModal = useCallback(() => setModalState(null), []);
  const showNext = useCallback(() => modalState && setModalState(s => s ? { ...s, currentIndex: (s.currentIndex + 1) % s.items.length } : null), [modalState]);
  const showPrev = useCallback(() => modalState && setModalState(s => s ? { ...s, currentIndex: (s.currentIndex - 1 + s.items.length) % s.items.length } : null), [modalState]);
  const showNextInSingleImageViewer = useCallback(() => setSingleImageViewerState(s => s ? { ...s, currentIndex: (s.currentIndex + 1) % s.items.length } : null), []);
  const showPrevInSingleImageViewer = useCallback(() => setSingleImageViewerState(s => s ? { ...s, currentIndex: (s.currentIndex - 1 + s.items.length) % s.items.length } : null), []);
  const [isServicesPopupOpen, setIsServicesPopupOpen] = useState(false);
  
  const anyModalOpen = modalState || orderModalState?.isOpen || isGalleryGridOpen || !!singleImageViewerState || isServicesPopupOpen || isLoginModalOpen || isSearchResultsModalOpen || isProfileModalOpen || isExploreModalOpen || isJobsModalOpen || isUploadModalOpen || isPostJobModalOpen || !!viewingJob || isEditProfileModalOpen || isCommunityModalOpen;
  useEffect(() => { document.body.style.overflow = anyModalOpen ? 'hidden' : 'auto'; }, [anyModalOpen]);
  
  useEffect(() => {
    const isVideoModalOpen = modalState && modalState.items.length > 0 && 'url' in modalState.items[0];
    const isAnyVideoPlaying = isVideoModalOpen || isVfxVideoPlaying;
    const backgroundAudio = audioRefs.current.background;
    if (backgroundAudio && audioUnlocked) backgroundAudio.volume = isAnyVideoPlaying ? 0 : siteConfig.audio.sources.background.volume;
  }, [modalState, isVfxVideoPlaying, audioUnlocked]);

  const handleInteraction = useCallback((e: React.MouseEvent | React.TouchEvent<HTMLDivElement>) => {
    if (!audioUnlocked) unlockAudio(); else safePlay(audioRefs.current.click?.play());
    const target = e.target as HTMLElement; const isInteractive = target.closest('a, button');
    const isTextElement = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P'].includes(target.tagName) || (target.tagName === 'SPAN' && target.childElementCount === 0);
    if (e.type === 'click' && 'button' in e && e.button !== 0) return;
    if (isTextElement && !isInteractive) { target.classList.add('animate-text-bounce'); setTimeout(() => target.classList.remove('animate-text-bounce'), 300); }
  }, [audioUnlocked, unlockAudio]);
  
  const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault(); if ((e.target as HTMLElement).closest('a, button, iframe, input, textarea, [role="dialog"]')) return;
      setContextMenu({ x: e.clientX, y: e.clientY });
  };
  
  const handleQuickActionClick = (service: Service) => {
      setContextMenu(null); if (!sections.portfolio.current) return; sections.portfolio.current.scrollIntoView({ behavior: 'smooth' });
      let targetId = '';
      if (service.name === 'VFX') { setActivePortfolioTab('vfx'); setActiveVfxSubTab('vfxEdits'); targetId = 'vfx-category-Cinematic-VFX'; } 
      else if (service.name.includes('Photo')) { setActivePortfolioTab('graphic'); targetId = 'graphic-category-Photo Manipulation'; } 
      else if (service.name.includes('Thumbnails')) { setActivePortfolioTab('graphic'); targetId = 'graphic-category-YouTube Thumbnails'; }
      setTimeout(() => document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 700);
  };
  
  const openGalleryGrid = () => { setIsGalleryGridOpen(true); setContextMenu(null); };
  const openSingleImageViewer = (startIndex: number) => { setSingleImageViewerState({ items: siteConfig.content.portfolio.graphicWorks, currentIndex: startIndex }); setIsGalleryGridOpen(false); };
  const openOrderModal = useCallback((mode: 'whatsapp' | 'email') => setOrderModalState({ isOpen: true, mode }), []);

  useEffect(() => { const handleClickOutside = (event: MouseEvent) => { if (contextMenu) setContextMenu(null); }; document.addEventListener('click', handleClickOutside); return () => document.removeEventListener('click', handleClickOutside); }, [contextMenu]);
  
  const handleRegisterSuccess = useCallback((newUser: User) => {
    if (profileSfxRef.current && audioUnlocked) { profileSfxRef.current.currentTime = 0; safePlay(profileSfxRef.current.play()); }
  }, [audioUnlocked]);
  
  const marketplaceEnabled = siteConfig.features.marketplace.enabled;

  return (
    <>
      <CustomCursor isVisible={!isLocked && appState === 'entered'} />
      <StormyVFXBackground onLightningFlash={triggerLightningReflection} isParallaxActive={isParallaxActive} appState={appState} />
      <div className="welcome-screen">
          <WelcomeScreen onEnter={handleEnter} onInteraction={unlockAudio} />
      </div>
      
      <div className="app-content-wrapper">
        <div className={`app-content text-white relative isolate transition-all duration-500 ${isLocked ? 'blur-md pointer-events-none' : ''}`} onClick={handleInteraction} onTouchStart={handleInteraction} onContextMenu={handleContextMenu}>
          <canvas ref={canvasRef} className="fixed top-0 left-0 -z-[5] pointer-events-none" />
          
          <Header 
              onScrollTo={scrollToSection} 
              onLoginClick={() => setIsLoginModalOpen(true)} 
              onViewProfile={viewProfile} 
              onSearch={handleSearch} 
              isReflecting={isReflecting} 
              onEditProfile={() => setIsEditProfileModalOpen(true)}
              // Marketplace props
              onUploadClick={() => setIsUploadModalOpen(true)} 
              onPostJobClick={() => setIsPostJobModalOpen(true)} 
              onExploreClick={() => setIsExploreModalOpen(true)} 
              onJobsClick={() => setIsJobsModalOpen(true)} 
              onCommunityClick={() => setIsCommunityModalOpen(true)}
          />

          <main>
            <div ref={sections.home} id="home"><Home onScrollTo={scrollToSection} onOrderNowClick={() => openOrderModal('whatsapp')} isReflecting={isReflecting} onServicesClick={() => setIsServicesPopupOpen(true)} /></div>
            <div ref={sections.portfolio} id="portfolio"><Portfolio openModal={openModal} isReflecting={isReflecting} activeTab={activePortfolioTab} setActiveTab={setActivePortfolioTab} activeVfxSubTab={activeVfxSubTab} setActiveVfxSubTab={setActiveVfxSubTab} onVideoPlaybackChange={setIsVfxVideoPlaying} /></div>
            <div ref={sections.contact} id="contact"><Contact onEmailClick={() => openOrderModal('email')} isReflecting={isReflecting} /></div>
          </main>
          <div ref={sections.about} id="about"><AboutAndFooter isReflecting={isReflecting} /></div>
          
          {modalState && <ModalViewer state={modalState} onClose={closeModal} onNext={showNext} onPrev={showPrev} />}
          {isGalleryGridOpen && <GalleryGridModal items={siteConfig.content.portfolio.graphicWorks} onClose={() => setIsGalleryGridOpen(false)} onImageClick={openSingleImageViewer} />}
          {singleImageViewerState && <ModalViewer state={singleImageViewerState} onClose={() => setSingleImageViewerState(null)} onNext={showNextInSingleImageViewer} onPrev={showPrevInSingleImageViewer} />}
          {isServicesPopupOpen && <ServicesPopup onClose={() => setIsServicesPopupOpen(false)} />}
          {orderModalState?.isOpen && <OrderModal mode={orderModalState.mode} onClose={() => setOrderModalState(null)} />}
          {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)} onQuickAction={handleQuickActionClick} onGalleryOpen={openGalleryGrid} />}
          
        </div>

        {isProfileModalOpen && viewingUser && <ProfileModal user={viewingUser} onClose={handleProfileModalClose} onEditProfile={() => setIsEditProfileModalOpen(true)} />}
        {isEditProfileModalOpen && currentUser && <EditProfileModal user={currentUser} onClose={() => setIsEditProfileModalOpen(false)} />}
        {isLoginModalOpen && <LoginModal onClose={handleLoginModalClose} onRegisterSuccess={handleRegisterSuccess} />}
        {isSearchResultsModalOpen && <SearchResultsModal users={searchResults} onViewProfile={viewProfile} onClose={() => setIsSearchResultsModalOpen(false)} />}
        
        {/* Marketplace Modals (conditionally rendered) */}
        {marketplaceEnabled && isExploreModalOpen && <ExploreModal onClose={() => setIsExploreModalOpen(false)} onViewPost={setViewingPost} onViewProfile={viewProfileByUsername} />}
        {marketplaceEnabled && isJobsModalOpen && <JobsModal onClose={() => setIsJobsModalOpen(false)} onViewJob={setViewingJob} onPostJobClick={() => { setIsJobsModalOpen(false); setIsPostJobModalOpen(true); }} />}
        {marketplaceEnabled && isUploadModalOpen && <UploadModal onClose={() => setIsUploadModalOpen(false)} />}
        {marketplaceEnabled && isPostJobModalOpen && <PostJobModal onClose={() => setIsPostJobModalOpen(false)} />}
        {marketplaceEnabled && viewingJob && <JobDetailsModal job={viewingJob} onClose={() => setViewingJob(null)} onViewProfile={viewProfileByUsername} />}
        {marketplaceEnabled && isCommunityModalOpen && <CommunityModal onClose={() => setIsCommunityModalOpen(false)} onViewProfile={viewProfileByUsername} />}

        {isLocked && !isLoginModalOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] animate-fade-in"></div>
        )}
      </div>
    </>
  );
}

export default function App() {
    return (
        <UserProvider>
            <MarketplaceProvider>
                <AppContent />
            </MarketplaceProvider>
        </UserProvider>
    );
}