import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { GraphicWork, VideoWork, Service, PortfolioTab, VfxSubTab, ModalItem, User } from './types';
import { GRAPHIC_WORKS, PROFILE_CREATION_SOUND, BACKGROUND_MUSIC_TRACKS } from './constants';
import { UserProvider, useUser } from './contexts/UserContext';

import { CustomCursor } from './components/CustomCursor';
import { StormyVFXBackground } from './components/StormyVFXBackground';
import { Header } from './components/Header';
import { Home, ServicesPopup } from './components/Home';
import { Portfolio } from './components/Portfolio';
import { Contact } from './components/Contact';
import { AboutAndFooter } from './components/AboutAndFooter';
import { ModalViewer, GalleryGridModal } from './components/ModalViewer';
import { ProfileModal } from './components/ProfileModal';
import { OrderModal } from './components/OrderModal';
import { ContextMenu } from './components/ContextMenu';
import { FuadAssistant } from './components/FuadAssistant';
import { LoginModal } from './components/LoginModal';
import { EditProfileModal } from './components/EditProfileModal';
import { WelcomeScreen } from './components/WelcomeScreen';

const AUDIO_SOURCES = {
  background: { src: 'https://www.dropbox.com/scl/fi/qw3lpt5irp4wzou3x68ij/space-atmospheric-background-124841.mp3?rlkey=roripitcuro099uar0kabwbb9&dl=1', volume: 0.15, loop: true },
  hover: { src: 'https://www.dropbox.com/scl/fi/n97lcyw8wizmd52xqzvk6/ui-sounds-pack-4-12-359738-1.mp3?rlkey=hsc3o5r8njrivygvn4wqw5fwi&dl=1', volume: 1, loop: false },
  click: { src: 'https://www.dropbox.com/scl/fi/kyhefzv1f8qbnax334rf5/anime-46068.mp3?rlkey=0mppg01wlork4wuk9d9yz23y3&dl=1', volume: 0.4, loop: false },
  profileClick: { src: 'https://www.dropbox.com/scl/fi/bik802kmtwh60iqo6kwwj/sample_hover_subtle02_kofi_by_miraclei-364170.mp3?rlkey=i9k7olqzqhud63fmha7ilxjlu&dl=1', volume: 1, loop: false },
  navClick: { src: 'https://www.dropbox.com/scl/fi/ldbwrq2lowpvcr7p85bar/deep-and-cinematic-woosh-sound-effect-318325.mp3?rlkey=d9sld3dksm4d4859ij8i7cgbd&dl=1', volume: 0.25, loop: false },
  imageHover1: { src: 'https://www.dropbox.com/scl/fi/218n6slrzgy0hka3mhead/ui-sounds-pack-4-12-359738.mp3?rlkey=k9dvvo3sekx5mxj9gli27nmeo&dl=1', volume: 0.4, loop: false },
  imageHover2: { src: 'https://www.dropbox.com/scl/fi/nwskelkksaqzp5pw1ov6s/ui-sounds-pack-5-14-359755.mp3?rlkey=aarm0y1cmotx2yek37o6mkzoi&dl=1', volume: 0.4, loop: false },
  mouseMove: { src: 'https://www.dropbox.com/scl/fi/eyhzvfq43cgzydnr1p16z/swoosh-016-383771.mp3?rlkey=ue4q0kt7rsmyxuiz6kwefsebw&dl=1', volume: 0.2, loop: false },
  storm: { src: 'https://www.dropbox.com/scl/fi/9q8t5vi7a81a4m8nb32gb/sounds-of-a-storm-with-wind-and-thunder-375923.mp3?rlkey=sqdjlw8dwilbg7zlwar1o5n7l&dl=1', volume: 0.6, loop: false },
  welcomeExit: { src: 'https://www.dropbox.com/scl/fi/cosps94ob7q539morzdo9/ui-sounds-pack-2-sound-5-358890.mp3?rlkey=co0gvw2403tc2ws0dhg9eavbr&st=y564seth&dl=1', volume: 0.5, loop: false },
};

const safePlay = (mediaPromise: Promise<void> | undefined) => {
    if (mediaPromise !== undefined) {
        mediaPromise.catch(error => {
            if ((error as DOMException).name !== 'AbortError') {
                console.error("Media playback failed:", error);
            }
        });
    }
};

type AppState = 'welcome' | 'entering' | 'entered';

const AppContent = () => {
  const { currentUser, isProfileCreationRequired } = useUser();
  const [appState, setAppState] = useState<AppState>('welcome');
  const [isVfxVideoPlaying, setIsVfxVideoPlaying] = useState(false);
  const [excessiveMovement, setExcessiveMovement] = useState(0);
  const [isParallaxActive, setIsParallaxActive] = useState(true);

  // Modal States
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [newlyRegisteredUser, setNewlyRegisteredUser] = useState<User | null>(null);

  const sections = { home: useRef<HTMLDivElement>(null), portfolio: useRef<HTMLDivElement>(null), contact: useRef<HTMLDivElement>(null), about: useRef<HTMLDivElement>(null) };
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isGalleryGridOpen, setIsGalleryGridOpen] = useState(false);
  const [singleImageViewerState, setSingleImageViewerState] = useState<{ items: GraphicWork[]; currentIndex: number } | null>(null);
  const [activePortfolioTab, setActivePortfolioTab] = useState<PortfolioTab>('graphic');
  const [activeVfxSubTab, setActiveVfxSubTab] = useState<VfxSubTab>('anime');
  const audioRefs = useRef<Record<keyof typeof AUDIO_SOURCES, HTMLAudioElement | null>>({ background: null, hover: null, click: null, profileClick: null, navClick: null, imageHover1: null, imageHover2: null, mouseMove: null, storm: null, welcomeExit: null });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const audioContextStarted = useRef(false);
  const canPlayMoveSound = useRef(true);
  const lastMousePosition = useRef({ x: 0, y: 0, time: Date.now() });
  const isStormSoundPlaying = useRef(false);
  const stormSoundFadeInterval = useRef<number | null>(null);
  const movementIntensity = useRef(0);
  const movementTimeout = useRef<number | null>(null);

  // Music Player Refs & State
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const profileSfxRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState(-1);

  const startBackgroundAudio = useCallback(() => {
    if (audioContextStarted.current) return;
    audioContextStarted.current = true;
    const backgroundAudio = audioRefs.current.background;
    if (backgroundAudio) {
      backgroundAudio.volume = AUDIO_SOURCES.background.volume;
      const playPromise = backgroundAudio?.play();
      if (playPromise !== undefined) {
          playPromise.catch(error => {
              if ((error as DOMException).name !== 'AbortError') {
                  console.log("Audio autoplay prevented by browser. Will start on user interaction.", error);
                  audioContextStarted.current = false;
              }
          });
      } else { audioContextStarted.current = false; }
    }
  }, []);
  
  const handleEnter = useCallback(() => {
    safePlay(audioRefs.current.welcomeExit?.play());
    setAppState('entering');
    startBackgroundAudio(); 
  }, [startBackgroundAudio]);

  useEffect(() => {
    if (appState === 'entering') {
      const timer = setTimeout(() => {
        setAppState('entered');
      }, 2000); 
      return () => clearTimeout(timer);
    }
  }, [appState]);

  const viewProfile = (user: User) => {
      setViewingUser(user);
      setIsProfileModalOpen(true);
  };

  const scrollToSection = useCallback((section: keyof typeof sections) => {
    const sectionElement = sections[section].current;
    if (sectionElement) {
        safePlay(audioRefs.current.navClick?.play());
        sectionElement.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sections]);

  useEffect(() => { 
    Object.entries(AUDIO_SOURCES).forEach(([key, config]) => { const audio = new Audio(config.src); audio.volume = config.volume; if (config.loop) audio.loop = true; audio.preload = 'auto'; audio.load(); audioRefs.current[key as keyof typeof AUDIO_SOURCES] = audio; }); 
    const musicAudio = new Audio();
    musicAudio.loop = true;
    musicAudioRef.current = musicAudio;
    
    const sfxAudio = new Audio(PROFILE_CREATION_SOUND);
    sfxAudio.volume = 0.7;
    profileSfxRef.current = sfxAudio;
  }, []);
  
  useEffect(() => {
    const handleMouseOver = (event: MouseEvent) => {
        if (!audioContextStarted.current) return;
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
  }, []);
  
    const handleMovement = useCallback((clientX: number, clientY: number) => {
        const now = Date.now();
        const timeDelta = now - lastMousePosition.current.time;

        if (timeDelta < 10) return;

        const distance = Math.sqrt(Math.pow(clientX - lastMousePosition.current.x, 2) + Math.pow(clientY - lastMousePosition.current.y, 2));
        const speed = distance / timeDelta;

        lastMousePosition.current = { x: clientX, y: clientY, time: now };

        if (speed > 8) {
            movementIntensity.current += 1;
        }

        if (movementTimeout.current) clearTimeout(movementTimeout.current);
        movementTimeout.current = window.setTimeout(() => {
            movementIntensity.current = Math.max(0, movementIntensity.current - 2);
        }, 500);

        if (movementIntensity.current > 20) {
            setExcessiveMovement(c => c + 1);
            movementIntensity.current = 0;
        }
    }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        handleMovement(e.clientX, e.clientY);
        
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!audioContextStarted.current || !ctx) return;
        
        const now = Date.now();
        const timeDelta = now - lastMousePosition.current.time;

        if (timeDelta > 20) {
            const distance = Math.sqrt(Math.pow(e.clientX - lastMousePosition.current.x, 2) + Math.pow(e.clientY - lastMousePosition.current.y, 2));
            const speed = distance / timeDelta;
            
            if (speed > 5) {
                ctx.beginPath();
                ctx.moveTo(lastMousePosition.current.x, lastMousePosition.current.y);
                ctx.lineTo(e.clientX, e.clientY);
                ctx.strokeStyle = 'white';
                ctx.lineWidth = Math.min(8, 2 + speed / 3); 
                ctx.lineCap = 'round';
                ctx.shadowColor = '#e50914';
                ctx.shadowBlur = 25;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

            if (speed > 3 && !isStormSoundPlaying.current) {
                const stormAudio = audioRefs.current.storm;
                if (stormAudio) {
                    isStormSoundPlaying.current = true;
                    stormAudio.currentTime = 0; stormAudio.volume = AUDIO_SOURCES.storm.volume;
                    safePlay(stormAudio.play());
                    setTimeout(() => {
                        if (stormSoundFadeInterval.current) clearInterval(stormSoundFadeInterval.current);
                        const fadeDuration = 1000; const fadeSteps = 20; const volumeStep = AUDIO_SOURCES.storm.volume / fadeSteps;
                        stormSoundFadeInterval.current = window.setInterval(() => {
                            if (stormAudio.volume > volumeStep) stormAudio.volume -= volumeStep;
                            else { if (stormSoundFadeInterval.current) clearInterval(stormSoundFadeInterval.current); stormAudio.pause(); stormAudio.volume = AUDIO_SOURCES.storm.volume; isStormSoundPlaying.current = false; }
                        }, fadeDuration / fadeSteps);
                    }, 5000);
                }
            }
        }
        if (canPlayMoveSound.current) {
            safePlay(audioRefs.current.mouseMove?.play());
            canPlayMoveSound.current = false;
            setTimeout(() => { canPlayMoveSound.current = true; }, 150);
        }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length > 0) {
            handleMovement(e.touches[0].clientX, e.touches[0].clientY);
        }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleMovement]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setCanvasSize = () => {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        ctx.scale(dpr, dpr);
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    let animationFrameId: number;
    const animate = () => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
        window.removeEventListener('resize', setCanvasSize);
        cancelAnimationFrame(animationFrameId);
    };
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
  
  useEffect(() => { const isAnyModalOpen = modalState || orderModalState?.isOpen || isGalleryGridOpen || !!singleImageViewerState || isServicesPopupOpen || isProfileCreationRequired || isProfileModalOpen || isEditProfileModalOpen; document.body.style.overflow = isAnyModalOpen ? 'hidden' : 'auto'; }, [modalState, orderModalState, isGalleryGridOpen, singleImageViewerState, isServicesPopupOpen, isProfileCreationRequired, isProfileModalOpen, isEditProfileModalOpen]);
  
  useEffect(() => {
    const isVideoModalOpen = modalState && modalState.items.length > 0 && 'url' in modalState.items[0];
    const isAnyVideoPlaying = isVideoModalOpen || isVfxVideoPlaying;
    const shouldMute = isAnyVideoPlaying || currentTrack > -1;
    const backgroundAudio = audioRefs.current.background;
    if (backgroundAudio) {
      backgroundAudio.volume = shouldMute ? 0 : AUDIO_SOURCES.background.volume;
    }
  }, [modalState, isVfxVideoPlaying, currentTrack]);

  const handleInteraction = useCallback((e: React.MouseEvent | React.TouchEvent<HTMLDivElement>) => {
    if (audioContextStarted.current) {
      safePlay(audioRefs.current.click?.play());
    }
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('a, button');
    const isTextElement = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P'].includes(target.tagName) || (target.tagName === 'SPAN' && target.childElementCount === 0);
    if (e.type === 'click' && 'button' in e && e.button !== 0) return;
    if (isTextElement && !isInteractive) {
        target.classList.add('animate-text-bounce');
        setTimeout(() => target.classList.remove('animate-text-bounce'), 300);
    }
  }, []);
  
  const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      if ((e.target as HTMLElement).closest('a, button, iframe, input, textarea, [role="dialog"]')) return;
      setContextMenu({ x: e.clientX, y: e.clientY });
  };
  
  const handleQuickActionClick = (service: Service) => {
      setContextMenu(null);
      if (!sections.portfolio.current) return;
      sections.portfolio.current.scrollIntoView({ behavior: 'smooth' });
      let targetId = '';
      if (service.name === 'VFX') {
          setActivePortfolioTab('vfx');
          setActiveVfxSubTab('vfxEdits');
          targetId = 'vfx-category-Cinematic-VFX';
      } else if (service.name.includes('Photo')) {
          setActivePortfolioTab('graphic');
          targetId = 'graphic-category-Photo Manipulation';
      } else if (service.name.includes('Thumbnails')) {
          setActivePortfolioTab('graphic');
          targetId = 'graphic-category-YouTube Thumbnails';
      }
      setTimeout(() => document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 700);
  };
  
  const openGalleryGrid = () => { setIsGalleryGridOpen(true); setContextMenu(null); };
  const openSingleImageViewer = (startIndex: number) => { setSingleImageViewerState({ items: GRAPHIC_WORKS, currentIndex: startIndex }); setIsGalleryGridOpen(false); };
  const openOrderModal = useCallback((mode: 'whatsapp' | 'email') => setOrderModalState({ isOpen: true, mode }), []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenu) setContextMenu(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu]);
  
  const handleRegisterSuccess = useCallback((newUser: User) => {
    if (profileSfxRef.current) {
      profileSfxRef.current.currentTime = 0;
      safePlay(profileSfxRef.current.play());
    }
    setNewlyRegisteredUser(newUser);
  }, []);

  // --- Music Player Controls ---
  const playMusic = useCallback((trackIndex: number) => {
    const musicAudio = musicAudioRef.current;
    if (!musicAudio || !BACKGROUND_MUSIC_TRACKS[trackIndex]) return false;
    musicAudio.src = BACKGROUND_MUSIC_TRACKS[trackIndex].url;
    safePlay(musicAudio.play());
    setCurrentTrack(trackIndex);
    return true;
  }, []);

  const pauseMusic = useCallback(() => {
    musicAudioRef.current?.pause();
    setCurrentTrack(-1);
    return true;
  }, []);

  const setVolume = useCallback((volume: number) => {
    const newVolume = Math.max(0, Math.min(1, volume / 100));
    const backgroundAudio = audioRefs.current.background;
    const musicAudio = musicAudioRef.current;
    if (backgroundAudio) backgroundAudio.volume = newVolume * 0.3; // Keep ambient lower
    if (musicAudio) musicAudio.volume = newVolume;
    return true;
  }, []);

  return (
    <div className={`root-container state-${appState}`}>
      <StormyVFXBackground onLightningFlash={triggerLightningReflection} isParallaxActive={isParallaxActive} appState={appState} />
      <WelcomeScreen onEnter={handleEnter} />
      
      <div className={`app-content text-white relative isolate transition-all duration-500 ${isProfileCreationRequired ? 'blur-md pointer-events-none' : ''}`} onClick={handleInteraction} onTouchStart={handleInteraction} onContextMenu={handleContextMenu}>
        <canvas ref={canvasRef} className="fixed top-0 left-0 -z-[5] pointer-events-none" />
        <CustomCursor isVisible={!isProfileCreationRequired} />
        
        <Header 
            onScrollTo={scrollToSection} 
            onViewProfile={viewProfile}
            onEditProfile={() => setIsEditProfileModalOpen(true)}
            isReflecting={isReflecting} 
        />
        <main>
          <div ref={sections.home} id="home"><Home onScrollTo={scrollToSection} onOrderNowClick={() => openOrderModal('whatsapp')} isReflecting={isReflecting} onServicesClick={() => setIsServicesPopupOpen(true)} /></div>
          <div ref={sections.portfolio} id="portfolio"><Portfolio openModal={openModal} isReflecting={isReflecting} activeTab={activePortfolioTab} setActiveTab={setActivePortfolioTab} activeVfxSubTab={activeVfxSubTab} setActiveVfxSubTab={setActiveVfxSubTab} onVideoPlaybackChange={setIsVfxVideoPlaying} /></div>
          <div ref={sections.contact} id="contact"><Contact onEmailClick={() => openOrderModal('email')} isReflecting={isReflecting} /></div>
        </main>
        <div ref={sections.about} id="about"><AboutAndFooter isReflecting={isReflecting} /></div>
        
        {modalState && <ModalViewer state={modalState} onClose={closeModal} onNext={showNext} onPrev={showPrev} />}
        {isGalleryGridOpen && <GalleryGridModal items={GRAPHIC_WORKS} onClose={() => setIsGalleryGridOpen(false)} onImageClick={openSingleImageViewer} />}
        {singleImageViewerState && <ModalViewer state={singleImageViewerState} onClose={() => setSingleImageViewerState(null)} onNext={showNextInSingleImageViewer} onPrev={showPrevInSingleImageViewer} />}
        {isServicesPopupOpen && <ServicesPopup onClose={() => setIsServicesPopupOpen(false)} />}
        {orderModalState?.isOpen && <OrderModal mode={orderModalState.mode} onClose={() => setOrderModalState(null)} />}
        {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)} onQuickAction={handleQuickActionClick} onGalleryOpen={openGalleryGrid} />}
        
        {appState === 'entered' && (
          <FuadAssistant 
            sectionRefs={sections} 
            audioUnlocked={audioContextStarted.current} 
            isProfileCardOpen={isProfileModalOpen} 
            onExcessiveMovement={excessiveMovement} 
            user={currentUser} 
            isLocked={isProfileCreationRequired} 
            setIsParallaxActive={setIsParallaxActive}
            newlyRegisteredUser={newlyRegisteredUser}
            onNewUserHandled={() => setNewlyRegisteredUser(null)}
            playMusic={playMusic}
            pauseMusic={pauseMusic}
            setVolume={setVolume}
          />
        )}
      </div>

      {isProfileModalOpen && viewingUser && <ProfileModal user={viewingUser} onClose={() => { setIsProfileModalOpen(false); setViewingUser(null); }} />}
      {isProfileCreationRequired && <LoginModal onRegisterSuccess={handleRegisterSuccess} />}
      {isEditProfileModalOpen && <EditProfileModal onClose={() => setIsEditProfileModalOpen(false)} />}
      
      {isProfileCreationRequired && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] animate-fade-in"></div>
      )}
    </div>
  );
}

export default function App() {
    return (
        <UserProvider>
            <AppContent />
        </UserProvider>
    );
}