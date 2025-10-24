
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { GraphicWork, VideoWork, Service, PortfolioTab, VfxSubTab, ModalItem } from './types';
import { GRAPHIC_WORKS } from './constants';

import { CustomCursor } from './components/CustomCursor';
import { GalaxyBackground } from './components/StormyVFXBackground';
import { Header } from './components/Header';
import { Home, ServicesPopup } from './components/Home';
import { Portfolio } from './components/Portfolio';
import { Contact } from './components/Contact';
import { AboutAndFooter } from './components/AboutAndFooter';
import { ModalViewer, GalleryGridModal } from './components/ModalViewer';
import { ProfileCard } from './components/ProfileCard';
import { OrderModal } from './components/OrderModal';
import { ContextMenu } from './components/ContextMenu';

const AUDIO_SOURCES = {
  background: { src: 'https://www.dropbox.com/scl/fi/qw3lpt5irp4wzou3x68ij/space-atmospheric-background-124841.mp3?rlkey=roripitcuro099uar0kabwbb9&dl=1', volume: 0.3, loop: true },
  hover: { src: 'https://www.dropbox.com/scl/fi/f7lx8ated99isnron643v/hover-button-287656.mp3?rlkey=4l2w3wf4gv8w6l2tak5j1soxg&dl=1', volume: 0.5, loop: false },
  click: { src: 'https://www.dropbox.com/scl/fi/kyhefzv1f8qbnax334rf5/anime-46068.mp3?rlkey=0mppg01wlork4wuk9d9yz23y3&dl=1', volume: 0.4, loop: false },
  navClick: { src: 'https://www.dropbox.com/scl/fi/ldbwrq2lowpvcr7p85bar/deep-and-cinematic-woosh-sound-effect-318325.mp3?rlkey=d9sld3dksm4d4859ij8i7cgbd&dl=1', volume: 0.25, loop: false },
  imageHover1: { src: 'https://www.dropbox.com/scl/fi/218n6slrzgy0hka3mhead/ui-sounds-pack-4-12-359738.mp3?rlkey=k9dvvo3sekx5mxj9gli27nmeo&dl=1', volume: 0.4, loop: false },
  imageHover2: { src: 'https://www.dropbox.com/scl/fi/nwskelkksaqzp5pw1ov6s/ui-sounds-pack-5-14-359755.mp3?rlkey=aarm0y1cmotx2yek37o6mkzoi&dl=1', volume: 0.4, loop: false },
  mouseMove: { src: 'https://www.dropbox.com/scl/fi/eyhzvfq43cgzydnr1p16z/swoosh-016-383771.mp3?rlkey=ue4q0kt7rsmyxuiz6kwefsebw&dl=1', volume: 0.2, loop: false },
  storm: { src: 'https://www.dropbox.com/scl/fi/9q8t5vi7a81a4m8nb32gb/sounds-of-a-storm-with-wind-and-thunder-375923.mp3?rlkey=sqdjlw8dwilbg7zlwar1o5n7l&dl=1', volume: 0.6, loop: false },
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

export default function App() {
  const [isContentLoaded, setIsContentLoaded] = useState(false);
  const [isVfxVideoPlaying, setIsVfxVideoPlaying] = useState(false);

  const sections = { home: useRef<HTMLDivElement>(null), portfolio: useRef<HTMLDivElement>(null), contact: useRef<HTMLDivElement>(null), about: useRef<HTMLDivElement>(null) };
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isGalleryGridOpen, setIsGalleryGridOpen] = useState(false);
  const [singleImageViewerState, setSingleImageViewerState] = useState<{ items: GraphicWork[]; currentIndex: number } | null>(null);
  const [activePortfolioTab, setActivePortfolioTab] = useState<PortfolioTab>('graphic');
  const [activeVfxSubTab, setActiveVfxSubTab] = useState<VfxSubTab>('anime');
  const audioRefs = useRef<Record<keyof typeof AUDIO_SOURCES, HTMLAudioElement | null>>({ background: null, hover: null, click: null, navClick: null, imageHover1: null, imageHover2: null, mouseMove: null, storm: null });

  const audioContextStarted = useRef(false);
  const canPlayMoveSound = useRef(true);
  const lastMousePosition = useRef({ x: 0, y: 0, time: Date.now() });
  const isStormSoundPlaying = useRef(false);
  const stormSoundFadeInterval = useRef<number | null>(null);

  const scrollToSection = useCallback((section: keyof typeof sections) => {
    const sectionElement = sections[section].current;
    if (sectionElement) {
        safePlay(audioRefs.current.navClick?.play());
        sectionElement.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sections]);

  useEffect(() => { setIsContentLoaded(true); }, []);

  const startBackgroundAudio = useCallback(() => {
    if (audioContextStarted.current) return;
    audioContextStarted.current = true;
    const backgroundAudio = audioRefs.current.background;
    const playPromise = backgroundAudio?.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            if ((error as DOMException).name !== 'AbortError') {
                console.log("Audio autoplay prevented.", error);
                audioContextStarted.current = false;
            }
        });
    } else { audioContextStarted.current = false; }
  }, []);

  useEffect(() => { Object.entries(AUDIO_SOURCES).forEach(([key, config]) => { const audio = new Audio(config.src); audio.volume = config.volume; if (config.loop) audio.loop = true; audio.preload = 'auto'; audio.load(); audioRefs.current[key as keyof typeof AUDIO_SOURCES] = audio; }); }, []);
  
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (!audioContextStarted.current) return;
        const now = Date.now();
        const timeDelta = now - lastMousePosition.current.time;
        if (timeDelta > 50) { 
            const distance = Math.sqrt(Math.pow(e.clientX - lastMousePosition.current.x, 2) + Math.pow(e.clientY - lastMousePosition.current.y, 2));
            const speed = distance / timeDelta;
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
            lastMousePosition.current = { x: e.clientX, y: e.clientY, time: now };
        }
        if (canPlayMoveSound.current) {
            safePlay(audioRefs.current.mouseMove?.play());
            canPlayMoveSound.current = false;
            setTimeout(() => { canPlayMoveSound.current = true; }, 150);
        }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  const [modalState, setModalState] = useState<{ items: ModalItem[]; currentIndex: number } | null>(null);
  const [isProfileCardOpen, setIsProfileCardOpen] = useState(false);
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
  
  useEffect(() => { const isAnyModalOpen = modalState || isProfileCardOpen || orderModalState?.isOpen || isGalleryGridOpen || !!singleImageViewerState || isServicesPopupOpen; document.body.style.overflow = isAnyModalOpen ? 'hidden' : 'auto'; }, [modalState, isProfileCardOpen, orderModalState, isGalleryGridOpen, singleImageViewerState, isServicesPopupOpen]);
  
  useEffect(() => {
    const isVideoModalOpen = modalState && modalState.items.length > 0 && 'url' in modalState.items[0];
    const isAnyVideoPlaying = isVideoModalOpen || isVfxVideoPlaying;
    const shouldMute = isAnyVideoPlaying;
    const backgroundAudio = audioRefs.current.background;
    if (backgroundAudio) {
      backgroundAudio.volume = shouldMute ? 0 : AUDIO_SOURCES.background.volume;
    }
  }, [modalState, isVfxVideoPlaying]);

  const handleInteraction = useCallback((e: React.MouseEvent | React.TouchEvent<HTMLDivElement>) => {
    if (!audioContextStarted.current) startBackgroundAudio(); else safePlay(audioRefs.current.click?.play());
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('a, button');
    const isTextElement = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P'].includes(target.tagName) || (target.tagName === 'SPAN' && target.childElementCount === 0);
    if (e.type === 'click' && 'button' in e && e.button !== 0) return;
    if (isTextElement && !isInteractive) {
        target.classList.add('animate-text-bounce');
        setTimeout(() => target.classList.remove('animate-text-bounce'), 300);
    }
  }, [startBackgroundAudio]);
  
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

  return (
    <div className="text-white" onClick={handleInteraction} onTouchStart={handleInteraction} onContextMenu={handleContextMenu}>
      <CustomCursor isVisible={true} />
      <div className={`main-content ${isContentLoaded ? 'visible' : ''}`}>
        <GalaxyBackground onLightningFlash={triggerLightningReflection} />
        <Header onScrollTo={scrollToSection} onProfileClick={() => setIsProfileCardOpen(true)} isReflecting={isReflecting} />
        <main>
          <div ref={sections.home}><Home onScrollTo={scrollToSection} onOrderNowClick={() => openOrderModal('whatsapp')} isReflecting={isReflecting} onServicesClick={() => setIsServicesPopupOpen(true)} /></div>
          <div ref={sections.portfolio}><Portfolio openModal={openModal} isReflecting={isReflecting} activeTab={activePortfolioTab} setActiveTab={setActivePortfolioTab} activeVfxSubTab={activeVfxSubTab} setActiveVfxSubTab={setActiveVfxSubTab} onVideoPlaybackChange={setIsVfxVideoPlaying} /></div>
          <div ref={sections.contact}><Contact onEmailClick={() => openOrderModal('email')} isReflecting={isReflecting} /></div>
        </main>
        <div ref={sections.about}><AboutAndFooter isReflecting={isReflecting} /></div>
        {modalState && <ModalViewer state={modalState} onClose={closeModal} onNext={showNext} onPrev={showPrev} />}
        {isGalleryGridOpen && <GalleryGridModal items={GRAPHIC_WORKS} onClose={() => setIsGalleryGridOpen(false)} onImageClick={openSingleImageViewer} />}
        {singleImageViewerState && <ModalViewer state={singleImageViewerState} onClose={() => setSingleImageViewerState(null)} onNext={showNextInSingleImageViewer} onPrev={showPrevInSingleImageViewer} />}
        {isServicesPopupOpen && <ServicesPopup onClose={() => setIsServicesPopupOpen(false)} />}
        {isProfileCardOpen && <ProfileCard onClose={() => setIsProfileCardOpen(false)} />}
        {orderModalState?.isOpen && <OrderModal mode={orderModalState.mode} onClose={() => setOrderModalState(null)} />}
        {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)} onQuickAction={handleQuickActionClick} onGalleryOpen={openGalleryGrid} />}
      </div>
    </div>
  );
}
