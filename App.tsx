
import React, { useState, useRef, useEffect, useCallback } from 'react';
// FIX: Removed 'LiveSession' from the import as it is not an exported member of '@google/genai'.
import { GoogleGenAI, Modality, Chat, GenerateContentResponse, LiveServerMessage } from "@google/genai";
import type { GraphicWork, VideoWork, Service, PortfolioTab, VfxSubTab, ChatMessage, ModalItem, Language, GenAIBlob } from './types';
import { GRAPHIC_WORKS, CHAT_TOOLS, getAiSystemInstruction, INACTIVITY_STORIES, MUSIC_TRACKS } from './constants';

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
import { Chat as ChatComponent } from './components/Chat';
import { FloatingChatButton } from './components/FloatingChatButton';
import { MusicPlayer } from './components/MusicPlayer';


const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// --- Audio Helper Functions ---
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array): GenAIBlob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
    const sampleRate = 24000;
    const numChannels = 1;
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

function pcmToWav(pcmData: Uint8Array): string {
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  view.setUint32(0, 0x52494646, false); view.setUint32(4, 36 + pcmData.byteLength, true); view.setUint32(8, 0x57415645, false); view.setUint32(12, 0x666d7420, false); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, numChannels, true); view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true); view.setUint16(32, numChannels * (bitsPerSample / 8), true); view.setUint16(34, bitsPerSample, true); view.setUint32(36, 0x64617461, false); view.setUint32(40, pcmData.byteLength, true);
  const wavBlob = new Blob([header, pcmData], { type: 'audio/wav' });
  return URL.createObjectURL(wavBlob);
}

const AUDIO_SOURCES = {
  background: { src: 'https://www.dropbox.com/scl/fi/qw3lpt5irp4wzou3x68ij/space-atmospheric-background-124841.mp3?rlkey=roripitcuro099uar0kabwbb9&dl=1', volume: 0.3, loop: true },
  hover: { src: 'https://www.dropbox.com/scl/fi/f7lx8ated99isnron643v/hover-button-287656.mp3?rlkey=4l2w3wf4gv8w6l2tak5j1soxg&dl=1', volume: 0.5, loop: false },
  click: { src: 'https://www.dropbox.com/scl/fi/kyhefzv1f8qbnax334rf5/anime-46068.mp3?rlkey=0mppg01wlork4wuk9d9yz23y3&dl=1', volume: 0.4, loop: false },
  navClick: { src: 'https://www.dropbox.com/scl/fi/ldbwrq2lowpvcr7p85bar/deep-and-cinematic-woosh-sound-effect-318325.mp3?rlkey=d9sld3dksm4d4859ij8i7cgbd&dl=1', volume: 0.25, loop: false },
  imageHover1: { src: 'https://www.dropbox.com/scl/fi/218n6slrzgy0hka3mhead/ui-sounds-pack-4-12-359738.mp3?rlkey=k9dvvo3sekx5mxj9gli27nmeo&dl=1', volume: 0.4, loop: false },
  imageHover2: { src: 'https://www.dropbox.com/scl/fi/nwskelkksaqzp5pw1ov6s/ui-sounds-pack-5-14-359755.mp3?rlkey=aarm0y1cmotx2yek37o6mkzoi&dl=1', volume: 0.4, loop: false },
  mouseMove: { src: 'https://www.dropbox.com/scl/fi/eyhzvfq43cgzydnr1p16z/swoosh-016-383771.mp3?rlkey=ue4q0kt7rsmyxuiz6kwefsebw&dl=1', volume: 0.2, loop: false },
  botThinking: { src: 'https://www.dropbox.com/scl/fi/v6snh7rfq9b7jzt1j1u6v/futuristic-sci-fi-bleep-96752.mp3?rlkey=26iwyu843dnh226z3z453ge5a&dl=1', volume: 0.4, loop: true },
  botMessageAppear: { src: 'https://www.dropbox.com/scl/fi/k1k1mcg5i8jbm3p3nxsi0/ui-sounds-pack-5-12-359748.mp3?rlkey=2vou1zx8nnejq1puszgff7jqa&dl=1', volume: 0.5, loop: false },
  botMessageDisappear: { src: 'https://www.dropbox.com/scl/fi/yv3fghbfrfgj77960opt1/ui-sounds-pack-5-11-359758.mp3?rlkey=kx29r1gmak6j9ai78jqr7cp99&dl=1', volume: 0.5, loop: false },
  storm: { src: 'https://www.dropbox.com/scl/fi/9q8t5vi7a81a4m8nb32gb/sounds-of-a-storm-with-wind-and-thunder-375923.mp3?rlkey=sqdjlw8dwilbg7zlwar1o5n7l&dl=1', volume: 0.6, loop: false },
  scaryRain: { src: 'https://www.dropbox.com/scl/fi/u5hoh8j4tcnw9wg6bl23c/massive-rain-storm-405133.mp3?rlkey=brmnmikdiu3g2ojjc3rn4ah83&st=zpn3erzo&dl=1', volume: 0.4, loop: true },
  scaryThunder: { src: 'https://www.dropbox.com/scl/fi/9q8t5vi7a81a4m8nb32gb/sounds-of-a-storm-with-wind-and-thunder-375923.mp3?rlkey=sqdjlw8dwilbg7zlwar1o5n7l&st=fcornkjf&dl=1', volume: 0.5, loop: false },
  scaryTransition: { src: 'https://www.dropbox.com/scl/fi/c4u0sk1pbr8915ikqlhti/scary-transition-401717.mp3?rlkey=7nowexp27dbxv9n7nfjj1h9nk&st=j38bibu5&dl=1', volume: 0.6, loop: false },
  scarySound1: { src: 'https://www.dropbox.com/scl/fi/oqwqffddbkaxvgcpgyzlz/scary-sound-effect-298866.mp3?rlkey=retgbspkc4ohcooahd647ctc3&st=gp5dfk89&dl=1', volume: 0.5, loop: false },
  scaryHit: { src: 'https://www.dropbox.com/scl/fi/2rlkqp96gp1i08b53iq1g/scary-hit-88300.mp3?rlkey=qa1je7r45r0zoe1lzq1xor21l&st=jlcflp9t&dl=1', volume: 0.7, loop: false },
  scaryPiano: { src: 'https://www.dropbox.com/scl/fi/164ncpg4b3lrtr0fhgojn/scary-piano-music-36174.mp3?rlkey=brlxy3p0h4j931mr3mr2koasy&st=bd7ouumv&dl=1', volume: 0.3, loop: true },
};

const SECTION_ANNOUNCEMENTS = {
  home: "Welcome to the home section. This is where the journey begins, showcasing my main services and creative direction. It's the digital handshake of my portfolio.",
  portfolio: "You're now entering the core of my creative world: the portfolio. Here you can explore a curated selection of my graphic designs, photo manipulations, and cinematic VFX work. Take your time, there's a lot to see.",
  contact: "This is the contact section. If my work resonates with you and you have a project in mind, this is the place to reach out. You'll find my social channels and email here. Let's create something unforgettable.",
  about: "And here we are at the about section. This gives you a little more insight into my creative philosophy and journey as a designer and editor. It's the story behind the pixels."
};

const WELCOME_BACK_MESSAGES: Record<Language, string[]> = {
    en: [ "Assalamu Alaikum and welcome back! It's great to see you again. Feel free to explore more of my work or continue our last conversation.", "Assalamu Alaikum! Welcome back to my creative space. Glad to have you here again. Let me know if anything catches your eye!", "Assalamu Alaikum, and welcome back! I was hoping I'd see you again. Ready to dive back into the world of design and VFX?" ],
    bn: [ "আসসালামু আলাইকুম, আবার স্বাগতম! আপনাকে আবার দেখে ভালো লাগলো। আমার আরও কাজ দেখতে পারেন অথবা আমাদের আগের কথা চালিয়ে যেতে পারেন।", "আসসালামু আলাইকুম! আমার ক্রিয়েটিভ জগতে আপনাকে আবার স্বাগতম। আপনাকে আবার এখানে পেয়ে আমি আনন্দিত। কোনো কিছু ভালো লাগলে জানাবেন!", "আসসালামু আলাইকুম, আপনাকে আবার দেখে খুব খুশি হলাম! ডিজাইন এবং ভিএফএক্সের জগতে আবার ডুব দিতে প্রস্তুত তো?" ],
    hi: [ "अस्सलामु अलैकुम, और आपका फिर से स्वागत है! आपको दोबारा देखकर बहुत अच्छा लगा। आप मेरा और काम देख सकते हैं या हमारी पिछली बातचीत जारी रख सकते हैं।", "अस्सलामु अलैकुम! मेरी रचनात्मक दुनिया में आपका फिर से स्वागत है। आपको यहाँ दोबारा देखकर खुशी हुई। अगर कुछ पसंद आए तो बताइएगा!", "अस्सलामु अलैकुम, और वापस स्वागत है! मुझे उम्मीद थी कि आप फिर आएंगे। क्या आप डिजाइन और वीएफएक्स की दुनिया में फिर से गोता लगाने के लिए तैयार हैं?" ],
    ur: [ "السلام علیکم، واپس خوش آمدید! آپ کو دوبارہ دیکھ کر بہت خوشی ہوئی۔ آپ मेरे مزید کام دیکھ सकते ہیں বা ہماری پچھلی گفتگو جاری رکھ सकते ہیں۔", "السلام علیکم! میری تخلیقی دنیا میں آپ کو ایک بار پھر خوش آمدید۔ آپ کو یہاں دوبارہ دیکھ کر خوشی ہوئی۔ اگر کوئی چیز آپ کی توجہ حاصل کرے تو مجھے بتائیں۔", "السلام علیکم، اور واپس خوش آمدید! مجھے امید تھی کہ میں آپ کو دوبارہ دیکھوں گا۔ کیا آپ ڈیزائن اور وی ایف ایکس کی دنیا میں دوبارہ غوطہ لگانے کے लिए तैयार ہیں؟" ]
};

const isSectionActive = (el: HTMLElement | null): boolean => {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  const windowHeight = (window.innerHeight || document.documentElement.clientHeight);
  return rect.top >= -10 && rect.top < windowHeight * 0.25;
};

const cleanSpeechText = (text: string): string => text.replace(/\[(PAUSE|softly|energetic)\]/gi, ' ').replace(/\*.*?\*/g, '').replace(/\s+/g, ' ').trim();
const cleanTextForTTS = (text: string): string => text.replace(/(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26ff]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g, '').replace(/\[.*?\]/g, ' ').replace(/\*.*?\*/g, '').trim();

type OldChatMessage = { sender: 'bot' | 'user'; text: string; id?: string; audioDuration?: number };

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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [chatLanguage, setChatLanguage] = useState<Language | 'auto'>('auto');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isChatMuted, setIsChatMuted] = useState(false);
  const [muteCountdown, setMuteCountdown] = useState(0);
  const [isVoiceMode, setIsVoiceMode] = useState(true);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isVfxVideoPlaying, setIsVfxVideoPlaying] = useState(false);
  const [isLiveSessionActive, setIsLiveSessionActive] = useState(false);

  const sections = { home: useRef<HTMLDivElement>(null), portfolio: useRef<HTMLDivElement>(null), contact: useRef<HTMLDivElement>(null), about: useRef<HTMLDivElement>(null) };
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [chatButtonRect, setChatButtonRect] = useState<DOMRect | null>(null);
  const [isGalleryGridOpen, setIsGalleryGridOpen] = useState(false);
  const [singleImageViewerState, setSingleImageViewerState] = useState<{ items: GraphicWork[]; currentIndex: number } | null>(null);
  const [activePortfolioTab, setActivePortfolioTab] = useState<PortfolioTab>('graphic');
  const [activeVfxSubTab, setActiveVfxSubTab] = useState<VfxSubTab>('anime');
  const audioRefs = useRef<Record<keyof typeof AUDIO_SOURCES, HTMLAudioElement | null>>({ background: null, hover: null, click: null, navClick: null, imageHover1: null, imageHover2: null, mouseMove: null, botThinking: null, botMessageAppear: null, botMessageDisappear: null, storm: null, scaryRain: null, scaryThunder: null, scaryTransition: null, scarySound1: null, scaryHit: null, scaryPiano: null });

  const ttsCache = useRef<Record<string, HTMLAudioElement>>({});
  const chatInstance = useRef<Chat | null>(null);
  const inChatIdleTimerRef = useRef<number | null>(null);
  const inChatIdleCount = useRef(0);
  const abuseStrikes = useRef(0);
  const audioQueue = useRef<Array<{ text: string; audio: HTMLAudioElement }>>([]);
  const isProcessingQueue = useRef(false);
  const streamingBotMessageId = useRef<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const chatButtonRef = useRef<HTMLDivElement>(null);
  const audioContextStarted = useRef(false);
  const welcomeStatus = useRef<'not_played' | 'playing' | 'played'>('not_played');
  const canPlayMoveSound = useRef(true);
  const muteIntervalRef = useRef<number | null>(null);
  const isReturningVisitorRef = useRef(false);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeSectionAnnounced = useRef<string | null>(null);
  const [musicPlayerState, setMusicPlayerState] = useState<{ isVisible: boolean; track: any | null }>({ isVisible: false, track: null });
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const ambienceAudioRef = useRef<{ audio: HTMLAudioElement; volume: number } | null>(null);
  const lastMousePosition = useRef({ x: 0, y: 0, time: Date.now() });
  const isStormSoundPlaying = useRef(false);
  const stormSoundFadeInterval = useRef<number | null>(null);

  // Live Session Refs
  const liveSessionPromise = useRef<Promise<any> | null>(null);
  const inputStream = useRef<MediaStream | null>(null);
  const inputAudioContext = useRef<AudioContext | null>(null);
  const outputAudioContext = useRef<AudioContext | null>(null);
  const scriptProcessorNode = useRef<ScriptProcessorNode | null>(null);
  const audioPlaybackQueue = useRef<Set<AudioBufferSourceNode>>(new Set());
  const liveUserMessageIdRef = useRef<string | null>(null);
  const liveBotMessageIdRef = useRef<string | null>(null);

  const stopCurrentAudio = useCallback(() => {
    if (activeAudioRef.current && !activeAudioRef.current.paused) {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
        activeAudioRef.current = null;
    }
  }, []);

  const stopAllSpeaking = useCallback(() => {
      if (welcomeStatus.current === 'playing') return;
      stopCurrentAudio();
      audioQueue.current = [];
      isProcessingQueue.current = false;
      setIsAudioPlaying(false);
      Object.values(ttsCache.current).forEach(audio => {
          if (audio && !audio.paused) {
              audio.pause();
              audio.currentTime = 0;
          }
      });
  }, [stopCurrentAudio]);

  const generateTtsAudio = useCallback(async (text: string, retries = 3, delay = 1000): Promise<HTMLAudioElement | null> => {
    for (let i = 0; i < retries; i++) {
        try {
          const textForSpeech = cleanTextForTTS(text);
          if (!textForSpeech) return null;
          if (ttsCache.current[textForSpeech]) {
            const cachedAudio = ttsCache.current[textForSpeech].cloneNode(true) as HTMLAudioElement;
            cachedAudio.volume = 0.7;
            return cachedAudio;
          }
          const response = await ai.models.generateContent({ model: "gemini-2.5-flash-preview-tts", contents: [{ parts: [{ text: textForSpeech }] }], config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } } } });
          const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
            const pcmData = decode(base64Audio);
            const audioUrl = pcmToWav(pcmData);
            const audio = new Audio(audioUrl);
            audio.volume = 0.7;
            ttsCache.current[textForSpeech] = audio.cloneNode(true) as HTMLAudioElement;
            return audio;
          }
        } catch (error) {
          console.error(`TTS Generation attempt ${i + 1} failed:`, error);
          if (i < retries - 1) await new Promise(res => setTimeout(res, delay * Math.pow(2, i))); else return null;
        }
    }
    return null;
  }, []);

  const playExclusiveAudio = useCallback((audioToPlay: HTMLAudioElement, onEndCallback?: () => void) => {
    stopCurrentAudio();
    if (musicAudioRef.current && !musicAudioRef.current.paused) musicAudioRef.current.pause();
    activeAudioRef.current = audioToPlay;
    audioToPlay.currentTime = 0;
    safePlay(audioToPlay.play());
    const onEnded = () => {
        safePlay(audioRefs.current.botMessageDisappear?.play());
        if (musicAudioRef.current?.paused && musicPlayerState.isVisible) safePlay(musicAudioRef.current.play());
        activeAudioRef.current = null;
        onEndCallback?.();
    };
    audioToPlay.addEventListener('ended', onEnded, { once: true });
  }, [stopCurrentAudio, musicPlayerState.isVisible]);
  
  const processAudioQueue = useCallback(() => {
    if (isProcessingQueue.current || audioQueue.current.length === 0) {
        if (audioQueue.current.length === 0) {
            setIsAudioPlaying(false);
            if (streamingBotMessageId.current) {
                setChatHistory(prev => prev.map(msg => msg.id === streamingBotMessageId.current ? { ...msg, isFinal: true } : msg));
                streamingBotMessageId.current = null;
            }
        }
        return;
    }
    if (!isAudioPlaying) setIsAudioPlaying(true);
    isProcessingQueue.current = true;
    const { text, audio } = audioQueue.current[0];
    if (streamingBotMessageId.current) {
        setChatHistory(prev => prev.map(msg => msg.id === streamingBotMessageId.current ? { ...msg, text: msg.text + text } : msg));
    }
    playExclusiveAudio(audio, () => {
        audioQueue.current.shift();
        isProcessingQueue.current = false;
        processAudioQueue();
    });
  }, [playExclusiveAudio, isAudioPlaying]);
  
  const processAndStripAmbienceCommands = useCallback((text: string): string => {
    const ambienceRegex = /\[AMBIENCE:(\w+)(?::([0-9.]+))?\]/g;
    let cleanText = text;
    let match;
    while ((match = ambienceRegex.exec(text)) !== null) {
        const [fullMatch, soundName, volumeStr] = match;
        if (ambienceAudioRef.current) {
            ambienceAudioRef.current.audio.pause();
            ambienceAudioRef.current = null;
        }
        if (soundName.toLowerCase() !== 'stop') {
            const audioKey = soundName as keyof typeof AUDIO_SOURCES;
            const audio = audioRefs.current[audioKey];
            if (audio) {
                const volume = parseFloat(volumeStr) || 0.3;
                audio.loop = AUDIO_SOURCES[audioKey]?.loop || false;
                audio.volume = volume;
                safePlay(audio.play());
                ambienceAudioRef.current = { audio, volume };
            }
        }
        cleanText = cleanText.replace(fullMatch, '');
    }
    return cleanText;
  }, []);

  const speakAndAddMessage = useCallback(async (text: string, options: { isBackground?: boolean } = {}) => {
      const { isBackground = false } = options;
      if (isBackground && isChatOpen) return;
      stopAllSpeaking();
      const processedText = processAndStripAmbienceCommands(text);
      const messageId = `${Date.now()}-${Math.random()}`;
      streamingBotMessageId.current = messageId;
      const placeholderMessage: ChatMessage = { id: messageId, sender: 'bot', text: '', isFinal: false };
      setChatHistory(prev => [...prev, placeholderMessage]);
      safePlay(audioRefs.current.botMessageAppear?.play());
      if (!isChatOpen) setUnreadMessageCount(prev => prev + 1);
      const audio = await generateTtsAudio(processedText);
      if (audio) {
          audioQueue.current.push({ text: cleanSpeechText(processedText), audio });
          if (!isProcessingQueue.current) processAudioQueue();
      } else {
          console.error("Audio generation failed for one-off message.");
          setChatHistory(prev => prev.map(msg => msg.id === messageId ? { ...msg, text: cleanSpeechText(processedText), isFinal: true } : msg));
          streamingBotMessageId.current = null;
      }
  }, [generateTtsAudio, isChatOpen, stopAllSpeaking, processAudioQueue, processAndStripAmbienceCommands]);

  const addBotTextMessage = useCallback(async (text: string) => {
      const processedText = processAndStripAmbienceCommands(text);
      const parts = processedText.split(/\[PAUSE\]/i).filter(p => p.trim() !== '');
      for (const part of parts) {
          const cleanPart = cleanSpeechText(part);
          if (!cleanPart) continue;
          const message: ChatMessage = { id: `${Date.now()}-${Math.random()}`, sender: 'bot', text: cleanPart.trim(), isFinal: true };
          setIsBotTyping(true);
          await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
          setIsBotTyping(false);
          setChatHistory(prev => [...prev, message]);
          if (!isChatOpen) setUnreadMessageCount(prev => prev + 1);
      }
  }, [isChatOpen, processAndStripAmbienceCommands]);

  const triggerBotMessage = useCallback((text: string, options: { isBackground?: boolean } = {}) => {
      if ((options.isBackground && isChatOpen) || welcomeStatus.current === 'playing') return;
      stopAllSpeaking();
      const processedText = processAndStripAmbienceCommands(text);
      const fullCleanText = cleanSpeechText(processedText);
      if (isVoiceMode) {
          const newBotMessage: ChatMessage = { id: `${Date.now()}-bot-proactive`, sender: 'bot', text: '', isFinal: false };
          streamingBotMessageId.current = newBotMessage.id;
          setChatHistory(prev => [...prev, newBotMessage]);
          if (!isChatOpen) setUnreadMessageCount(prev => prev + 1);
          (async () => {
              const sentences = processedText.split(/(?<=[.!?])\s+/).filter(s => s.trim());
              for (const sentence of sentences) {
                  if (sentence.trim()) {
                      const audio = await generateTtsAudio(sentence);
                      if (audio) {
                          audioQueue.current.push({ text: cleanSpeechText(sentence), audio });
                          if (!isProcessingQueue.current) processAudioQueue();
                      }
                  }
              }
              if (audioQueue.current.length === 0) {
                   setChatHistory(prev => prev.map(msg => msg.id === newBotMessage.id ? { ...msg, text: fullCleanText, isFinal: true } : msg));
                   streamingBotMessageId.current = null;
              }
          })();
      } else {
          addBotTextMessage(text);
      }
  }, [isVoiceMode, isChatOpen, addBotTextMessage, generateTtsAudio, processAudioQueue, stopAllSpeaking, processAndStripAmbienceCommands]);

  useEffect(() => {
    const handleScroll = () => {
        for (const [name, ref] of Object.entries(sections)) {
            if (isSectionActive(ref.current) && activeSectionAnnounced.current !== name) {
                activeSectionAnnounced.current = name;
                const announcement = SECTION_ANNOUNCEMENTS[name as keyof typeof SECTION_ANNOUNCEMENTS];
                if (announcement) triggerBotMessage(announcement, { isBackground: true });
                break;
            }
        }
    };
    const throttledScroll = () => setTimeout(() => requestAnimationFrame(handleScroll), 200);
    window.addEventListener('scroll', throttledScroll);
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [sections, triggerBotMessage]);

  const scrollToSection = useCallback((section: keyof typeof sections) => {
    const sectionElement = sections[section].current;
    if (sectionElement) {
        safePlay(audioRefs.current.navClick?.play());
        sectionElement.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sections]);

  const initializeChat = useCallback((lang: Language | 'auto', currentHistory: ChatMessage[]) => {
    const languageMap: Record<Language, string> = { en: 'English', bn: 'Bangla', hi: 'Hindi', ur: 'Urdu' };
    const currentLangName = lang !== 'auto' ? languageMap[lang] : 'the user\'s preferred language';
    const systemInstruction = getAiSystemInstruction(currentLangName);
    const geminiHistory = currentHistory.filter(msg => msg.isFinal).map((msg) => ({ role: msg.sender === 'bot' ? 'model' : 'user', parts: [{ text: msg.text }] }));
    chatInstance.current = ai.chats.create({ model: 'gemini-2.5-flash', history: geminiHistory, config: { systemInstruction, tools: [{ functionDeclarations: CHAT_TOOLS }] } });
  }, []);

  useEffect(() => {
    isReturningVisitorRef.current = localStorage.getItem('fuad_has_visited') === 'true';
    try {
      const storedHistory: OldChatMessage[] = JSON.parse(localStorage.getItem('fuad_chat_history') || '[]');
      const migratedHistory: ChatMessage[] = storedHistory.map((msg, index) => ({ sender: msg.sender, text: msg.text, id: msg.id || `${Date.now()}-migrated-${index}`, isFinal: true }));
      setChatHistory(migratedHistory);
      const storedLang = (localStorage.getItem('fuad_chat_language') as Language | 'auto') || 'auto';
      setChatLanguage(storedLang);
      initializeChat(storedLang, migratedHistory);
    } catch (error) {
      console.error("Failed to initialize chat from localStorage:", error);
      initializeChat('auto', []);
    }
  }, [initializeChat]);
  
  useEffect(() => { try { localStorage.setItem('fuad_chat_history', JSON.stringify(chatHistory)); } catch (error) { console.error("Failed to save chat history", error); } }, [chatHistory]);
  const handleLanguageChange = useCallback((lang: Language) => { setChatLanguage(lang); try { localStorage.setItem('fuad_chat_language', lang); } catch (e) { console.error(e) } initializeChat(lang, chatHistory); }, [chatHistory, initializeChat]);

  useEffect(() => { setIsContentLoaded(true); const goOnline = () => setIsOffline(false); const goOffline = () => setIsOffline(true); window.addEventListener('online', goOnline); window.addEventListener('offline', goOffline); return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); } }, []);

  const handleSendMessage = useCallback(async (message: string) => {
    stopAllSpeaking();
    const userMessage: ChatMessage = { sender: 'user', text: message, id: `${Date.now()}-user`, isFinal: true };
    if (isOffline) { triggerBotMessage("It seems you're offline. My chat abilities are limited right now, but I'll be here when you reconnect!"); return; }
    setChatHistory(prev => [...prev, userMessage]);
    setIsBotTyping(true);
    inChatIdleCount.current = 0;
    const slowNetworkTimer = setTimeout(() => { speakAndAddMessage( ["Just a moment...", "Hmm, thinking...", "Ugh, this connection..."][Math.floor(Math.random() * 3)]); }, 4000);
    if (chatLanguage === 'auto' && chatHistory.filter(m => m.sender === 'user').length <= 1) {
        try {
          const detectionResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: `Analyze the following text and identify its primary language. Respond with only ONE of the following language codes: 'en' for English, 'bn' for Bangla, 'hi' for Hindi, 'ur' for Urdu. If the language appears to be a mix of Hindi and Urdu using the Roman script, default to 'ur' (Urdu). Text: "${message}"` });
          const detectedLang = detectionResponse.text.trim() as Language;
          if (['en', 'bn', 'hi', 'ur'].includes(detectedLang)) handleLanguageChange(detectedLang);
        } catch (e) { console.error("Language detection failed", e); }
    }
    if (!chatInstance.current) { console.error("Chat not initialized!"); setIsBotTyping(false); return; }
    try {
        const stream = await chatInstance.current.sendMessageStream({ message });
        let sentenceBufferForAudio = ''; streamingBotMessageId.current = null; let firstChunk = true;
        for await (const chunk of stream) {
            let processedChunkText = chunk.text;
            if (firstChunk) {
                if (ambienceAudioRef.current) { ambienceAudioRef.current.audio.pause(); ambienceAudioRef.current = null; }
                processedChunkText = processAndStripAmbienceCommands(chunk.text); firstChunk = false;
            }
            if (!streamingBotMessageId.current) {
                clearTimeout(slowNetworkTimer); setIsBotTyping(false);
                const newBotMessage: ChatMessage = { id: `${Date.now()}-bot`, sender: 'bot', text: '', isFinal: false };
                streamingBotMessageId.current = newBotMessage.id;
                setChatHistory(prev => [...prev, newBotMessage]);
                safePlay(audioRefs.current.botMessageAppear?.play());
                if (!isChatOpen) setUnreadMessageCount(prev => prev + 1);
            }
            sentenceBufferForAudio += processedChunkText;
            const sentences = sentenceBufferForAudio.split(/(?<=[.!?])\s+/);
            if (sentences.length > 1) {
                const completeSentences = sentences.slice(0, -1);
                sentenceBufferForAudio = sentences[sentences.length - 1] || '';
                for (const sentence of completeSentences) {
                    if (sentence.trim()) {
                        const audio = await generateTtsAudio(sentence);
                        if (audio) { audioQueue.current.push({ text: cleanSpeechText(sentence), audio }); if (!isProcessingQueue.current) processAudioQueue(); }
                    }
                }
            }
        }
        if (sentenceBufferForAudio.trim()) {
            const audio = await generateTtsAudio(sentenceBufferForAudio);
            if (audio) { audioQueue.current.push({ text: cleanSpeechText(sentenceBufferForAudio), audio }); if (!isProcessingQueue.current) processAudioQueue(); }
        }
        if (audioQueue.current.length === 0 && streamingBotMessageId.current) {
            setChatHistory(prev => prev.map(msg => msg.id === streamingBotMessageId.current ? { ...msg, text: cleanSpeechText(sentenceBufferForAudio), isFinal: true } : msg));
            streamingBotMessageId.current = null;
        }
    } catch (error) { console.error("Gemini chat error:", error); triggerBotMessage("Sorry, I'm having a little trouble connecting. Please try again in a moment.");
    } finally { clearTimeout(slowNetworkTimer); setIsBotTyping(false); }
  }, [chatHistory, chatLanguage, triggerBotMessage, isOffline, handleLanguageChange, isVoiceMode, stopAllSpeaking, isChatOpen, generateTtsAudio, processAudioQueue, speakAndAddMessage, processAndStripAmbienceCommands]);
  
  // --- Live Session Logic ---
  const stopLiveSession = useCallback(async () => {
    console.log("Stopping live session...");
    setIsLiveSessionActive(false);

    if (liveUserMessageIdRef.current || liveBotMessageIdRef.current) {
        setChatHistory(prev => prev.map(msg => {
            if (msg.id === liveUserMessageIdRef.current || msg.id === liveBotMessageIdRef.current) {
                return { ...msg, isFinal: true };
            }
            return msg;
        }));
        liveUserMessageIdRef.current = null;
        liveBotMessageIdRef.current = null;
    }

    if (liveSessionPromise.current) {
      const session = await liveSessionPromise.current;
      session.close();
      liveSessionPromise.current = null;
    }
    if (inputStream.current) {
      inputStream.current.getTracks().forEach(track => track.stop());
      inputStream.current = null;
    }
    if (scriptProcessorNode.current) {
      scriptProcessorNode.current.disconnect();
      scriptProcessorNode.current = null;
    }
    if (inputAudioContext.current) {
      inputAudioContext.current.close();
      inputAudioContext.current = null;
    }
    if (outputAudioContext.current) {
        audioPlaybackQueue.current.forEach(source => source.stop());
        audioPlaybackQueue.current.clear();
        outputAudioContext.current.close();
        outputAudioContext.current = null;
    }
  }, []);

  const startLiveSession = useCallback(async () => {
    if (isLiveSessionActive) return;
    stopAllSpeaking();
    setIsLiveSessionActive(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      inputStream.current = stream;

      const languageMap: Record<Language, string> = { en: 'English', bn: 'Bangla', hi: 'Hindi', ur: 'Urdu' };
      const currentLangName = chatLanguage !== 'auto' ? languageMap[chatLanguage] : 'the user\'s preferred language';
      const systemInstruction = getAiSystemInstruction(currentLangName);

      let nextStartTime = 0;
      let currentInput = '';
      let currentOutput = '';
      
      outputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      liveSessionPromise.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          systemInstruction,
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
        },
        callbacks: {
          onopen: () => {
            inputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const source = inputAudioContext.current.createMediaStreamSource(stream);
            scriptProcessorNode.current = inputAudioContext.current.createScriptProcessor(4096, 1, 1);
            scriptProcessorNode.current.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              liveSessionPromise.current?.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessorNode.current);
            scriptProcessorNode.current.connect(inputAudioContext.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
                currentInput += message.serverContent.inputTranscription.text;
                setChatHistory(prev => {
                    if (!liveUserMessageIdRef.current) {
                        const newMsgId = `${Date.now()}-user-live`;
                        liveUserMessageIdRef.current = newMsgId;
                        return [...prev, { id: newMsgId, sender: 'user', text: currentInput, isFinal: false }];
                    }
                    return prev.map(msg => msg.id === liveUserMessageIdRef.current ? { ...msg, text: currentInput } : msg);
                });
            }
            if (message.serverContent?.outputTranscription) {
                currentOutput += message.serverContent.outputTranscription.text;
                setChatHistory(prev => {
                    if (!liveBotMessageIdRef.current) {
                        const newMsgId = `${Date.now()}-bot-live`;
                        liveBotMessageIdRef.current = newMsgId;
                        return [...prev, { id: newMsgId, sender: 'bot', text: currentOutput, isFinal: false }];
                    }
                    return prev.map(msg => msg.id === liveBotMessageIdRef.current ? { ...msg, text: currentOutput } : msg);
                });
            }
            if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
              const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
              const oac = outputAudioContext.current;
              if (oac) {
                  nextStartTime = Math.max(nextStartTime, oac.currentTime);
                  const audioBuffer = await decodeAudioData(decode(base64Audio), oac);
                  const source = oac.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(oac.destination);
                  source.addEventListener('ended', () => audioPlaybackQueue.current.delete(source));
                  source.start(nextStartTime);
                  nextStartTime += audioBuffer.duration;
                  audioPlaybackQueue.current.add(source);
              }
            }
            if (message.serverContent?.turnComplete) {
                setChatHistory(prev => prev.map(msg => {
                    if (msg.id === liveUserMessageIdRef.current || msg.id === liveBotMessageIdRef.current) {
                        return { ...msg, isFinal: true, text: msg.text.trim() };
                    }
                    return msg;
                }).filter(msg => msg.text)); // Remove empty messages if any
                liveUserMessageIdRef.current = null;
                liveBotMessageIdRef.current = null;
                currentInput = '';
                currentOutput = '';
            }
          },
          onerror: (e: ErrorEvent) => { console.error('Live session error:', e); stopLiveSession(); },
          onclose: () => { console.log('Live session closed.'); stopLiveSession(); },
        },
      });
    } catch (error) {
      console.error('Failed to start live session:', error);
      speakAndAddMessage("I couldn't access your microphone. Please check your browser permissions and try again.");
      stopLiveSession();
    }
  }, [isLiveSessionActive, stopAllSpeaking, chatLanguage, stopLiveSession, speakAndAddMessage]);

  const handleToggleLiveSession = useCallback(() => {
    if (isLiveSessionActive) {
      stopLiveSession();
    } else {
      startLiveSession();
    }
  }, [isLiveSessionActive, startLiveSession, stopLiveSession]);

  const startBackgroundAudio = useCallback(() => {
    if (audioContextStarted.current) return;
    audioContextStarted.current = true;
    const backgroundAudio = audioRefs.current.background;
    const playPromise = backgroundAudio?.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            if (isContentLoaded && welcomeStatus.current === 'not_played') {
                welcomeStatus.current = 'playing';
                setTimeout(() => { welcomeStatus.current = 'played'; }, 20000);
                const storedLang = (localStorage.getItem('fuad_chat_language') as Language) || 'en';
                if (isReturningVisitorRef.current) {
                    const messagesForLang = WELCOME_BACK_MESSAGES[storedLang] || WELCOME_BACK_MESSAGES.en;
                    triggerBotMessage(messagesForLang[Math.floor(Math.random() * messagesForLang.length)], { isBackground: true });
                } else {
                    localStorage.setItem('fuad_has_visited', 'true');
                    speakAndAddMessage("Assalamu Alaikum! I'm Fuad's creative partner. Welcome to our world of design and VFX. Have a look around, and feel free to chat with me anytime! 😊", { isBackground: true });
                    setTimeout(() => {
                        if (welcomeStatus.current !== 'playing') return;
                        if (!sessionStorage.getItem('hasRightClicked')) {
                            triggerBotMessage("Oh, and a little pro-tip for you... [PAUSE] If you right-click anywhere on the site, a secret 'Quick Actions' menu will appear. It's a super fast way to jump to my main services or see all my designs in the Works Gallery at once. Give it a try! 😉", { isBackground: true });
                            sessionStorage.setItem('hasRightClicked', 'true');
                        }
                    }, 10000);
                }
            }
        }).catch(error => {
            if ((error as DOMException).name !== 'AbortError') {
                console.log("Audio autoplay prevented.", error);
                audioContextStarted.current = false;
            }
        });
    } else { audioContextStarted.current = false; }
  }, [isContentLoaded, triggerBotMessage, speakAndAddMessage]);

  useEffect(() => { Object.entries(AUDIO_SOURCES).forEach(([key, config]) => { const audio = new Audio(config.src); audio.volume = config.volume; if (config.loop) audio.loop = true; audio.preload = 'auto'; audio.load(); audioRefs.current[key as keyof typeof AUDIO_SOURCES] = audio; }); return () => { if(muteIntervalRef.current) clearInterval(muteIntervalRef.current); } }, []);
  const sendInChatIdlePrompt = useCallback(async () => {
    if (isChatOpen || isAudioPlaying || chatHistory.some(m => !m.isFinal) || inChatIdleCount.current >= 1) return;
    inChatIdleCount.current++;
    if (!chatInstance.current || chatHistory.length < 2) { triggerBotMessage(INACTIVITY_STORIES[Math.floor(Math.random() * INACTIVITY_STORIES.length)], { isBackground: true }); return; }
    try {
        const contextMessages = chatHistory.slice(-4).map(m => `${m.sender === 'user' ? 'User' : 'AI'}: ${m.text}`).join('\n');
        const prompt = `Based on this recent conversation:\n${contextMessages}\n\nThe user is now idle. As Fuad's creative AI partner, briefly and naturally do one of the following in 1-2 sentences: ask a relevant follow-up question, share a short, related story or creative idea, or gently muse on the topic. Your response should sound human and spontaneous, not scripted.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        triggerBotMessage(response.text, { isBackground: true });
    } catch (error) { console.error("Failed to generate contextual idle prompt:", error); triggerBotMessage(INACTIVITY_STORIES[Math.floor(Math.random() * INACTIVITY_STORIES.length)], { isBackground: true }); }
  }, [isChatOpen, isAudioPlaying, chatHistory, triggerBotMessage]);

  const resetInChatIdleTimer = useCallback(() => { if (inChatIdleTimerRef.current) clearTimeout(inChatIdleTimerRef.current); if(!isChatOpen && !chatHistory.some(m => !m.isFinal)) { inChatIdleTimerRef.current = window.setTimeout(sendInChatIdlePrompt, 45000); } }, [isChatOpen, chatHistory, sendInChatIdlePrompt]);
  useEffect(() => { resetInChatIdleTimer(); return () => { if (inChatIdleTimerRef.current) clearTimeout(inChatIdleTimerRef.current); }; }, [chatHistory, resetInChatIdleTimer]);
  const handleChatUserActivity = useCallback(() => { inChatIdleCount.current = 0; resetInChatIdleTimer(); }, [resetInChatIdleTimer]);
  
  useEffect(() => {
    const handleMouseOver = (event: MouseEvent) => {
        if (!audioContextStarted.current) return;
        handleChatUserActivity();
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
  }, [handleChatUserActivity]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (!audioContextStarted.current) return;
        handleChatUserActivity();
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
  }, [handleChatUserActivity]);
  
  const [modalState, setModalState] = useState<{ items: ModalItem[]; currentIndex: number } | null>(null);
  const [isProfileCardOpen, setIsProfileCardOpen] = useState(false);
  const [orderModalState, setOrderModalState] = useState<{ isOpen: boolean; mode: 'whatsapp' | 'email' } | null>(null);
  const [isReflecting, setIsReflecting] = useState(false);
  const reflectTimeoutRef = useRef<number | null>(null);
  const triggerLightningReflection = useCallback(() => { if (reflectTimeoutRef.current) clearTimeout(reflectTimeoutRef.current); setIsReflecting(true); reflectTimeoutRef.current = window.setTimeout(() => setIsReflecting(false), 400); }, []);
  const openModal = useCallback((items: ModalItem[], startIndex: number) => { if (items.length > 0 && 'url' in items[0]) stopAllSpeaking(); setModalState({ items, currentIndex: startIndex }); }, [stopAllSpeaking]);
  const closeModal = useCallback(() => setModalState(null), []);
  const showNext = useCallback(() => modalState && setModalState(s => s ? { ...s, currentIndex: (s.currentIndex + 1) % s.items.length } : null), [modalState]);
  const showPrev = useCallback(() => modalState && setModalState(s => s ? { ...s, currentIndex: (s.currentIndex - 1 + s.items.length) % s.items.length } : null), [modalState]);
  const showNextInSingleImageViewer = useCallback(() => setSingleImageViewerState(s => s ? { ...s, currentIndex: (s.currentIndex + 1) % s.items.length } : null), []);
  const showPrevInSingleImageViewer = useCallback(() => setSingleImageViewerState(s => s ? { ...s, currentIndex: (s.currentIndex - 1 + s.items.length) % s.items.length } : null), []);
  const [isServicesPopupOpen, setIsServicesPopupOpen] = useState(false);
  
  useEffect(() => { const isAnyModalOpen = modalState || isProfileCardOpen || orderModalState?.isOpen || isGalleryGridOpen || !!singleImageViewerState || isServicesPopupOpen; document.body.style.overflow = isAnyModalOpen ? 'hidden' : 'auto'; if (isAnyModalOpen && isChatOpen) setIsChatOpen(false); }, [modalState, isProfileCardOpen, orderModalState, isGalleryGridOpen, singleImageViewerState, isServicesPopupOpen, isChatOpen]);
  
  useEffect(() => {
    const isVideoModalOpen = modalState && modalState.items.length > 0 && 'url' in modalState.items[0];
    const isAnyVideoPlaying = isVideoModalOpen || isVfxVideoPlaying;
    const shouldMute = isAnyVideoPlaying || isAudioPlaying || isLiveSessionActive;
    const backgroundAudio = audioRefs.current.background;
    if (backgroundAudio) {
      backgroundAudio.volume = shouldMute ? 0 : AUDIO_SOURCES.background.volume;
    }
    if (ambienceAudioRef.current) {
      ambienceAudioRef.current.audio.volume = isAnyVideoPlaying ? 0 : ambienceAudioRef.current.volume;
    }
  }, [modalState, isVfxVideoPlaying, isAudioPlaying, isLiveSessionActive]);

  const handleInteraction = useCallback((e: React.MouseEvent | React.TouchEvent<HTMLDivElement>) => {
    handleChatUserActivity();
    if (!audioContextStarted.current) startBackgroundAudio(); else safePlay(audioRefs.current.click?.play());
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('a, button');
    const isTextElement = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P'].includes(target.tagName) || (target.tagName === 'SPAN' && target.childElementCount === 0);
    if (e.type === 'click' && 'button' in e && e.button !== 0) return;
    if (isTextElement && !isInteractive) {
        target.classList.add('animate-text-bounce');
        setTimeout(() => target.classList.remove('animate-text-bounce'), 300);
    }
  }, [startBackgroundAudio, handleChatUserActivity]);
  
  const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      if ((e.target as HTMLElement).closest('a, button, iframe, input, textarea, [role="dialog"]')) return;
      setContextMenu({ x: e.clientX, y: e.clientY });
      if (!sessionStorage.getItem('hasRightClicked')) {
          triggerBotMessage("Ah, you've discovered a little secret! 😉 [PAUSE] This is the Quick Actions menu. It's a shortcut I designed to help you jump directly to my most popular services in the portfolio, or you can open the full Works Gallery to see everything at once. Pretty cool, huh?", { isBackground: true });
          sessionStorage.setItem('hasRightClicked', 'true');
      }
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
      const target = event.target as Node;
      if (contextMenu) setContextMenu(null);
      const isClickOnModal = target.parentElement?.closest('[role="dialog"]');
      if (isChatOpen && chatRef.current && !chatRef.current.contains(target) && chatButtonRef.current && !chatButtonRef.current.contains(target) && !isClickOnModal) setIsChatOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isChatOpen, contextMenu]);

  useEffect(() => { const button = chatButtonRef.current; if(!button) return; const observer = new ResizeObserver(() => { setChatButtonRect(button.getBoundingClientRect()); }); observer.observe(button); return () => observer.disconnect(); }, []);

  return (
    <div className="text-white" onClick={handleInteraction} onTouchStart={handleInteraction} onContextMenu={handleContextMenu}>
      <CustomCursor isVisible={true} />
      <ChatComponent
          ref={chatRef}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          history={chatHistory}
          onSendMessage={handleSendMessage}
          isBotTyping={isBotTyping}
          onUserActivity={handleChatUserActivity}
          currentLanguage={chatLanguage}
          onLanguageChange={handleLanguageChange}
          isMuted={isChatMuted}
          muteCountdown={muteCountdown}
          isVoiceMode={isVoiceMode}
          onSetVoiceMode={setIsVoiceMode}
          isAudioPlaying={isAudioPlaying}
          isLiveSessionActive={isLiveSessionActive}
          onToggleLiveSession={handleToggleLiveSession}
      />
      <FloatingChatButton ref={chatButtonRef} onClick={() => { if (isChatOpen) return; setIsChatOpen(true); setUnreadMessageCount(0); inChatIdleCount.current = 0; }} unreadMessageCount={unreadMessageCount} isChatBotSpeaking={isAudioPlaying} isOpen={isChatOpen} />
      {musicPlayerState.isVisible && musicPlayerState.track && (<MusicPlayer track={musicPlayerState.track} onClose={() => setMusicPlayerState({ isVisible: false, track: null })} audioRef={musicAudioRef} />)}
      <div className={`main-content ${isContentLoaded ? 'visible' : ''}`}>
        <GalaxyBackground onLightningFlash={triggerLightningReflection} />
        <Header onScrollTo={scrollToSection} onProfileClick={() => setIsProfileCardOpen(true)} isReflecting={isReflecting} />
        <main>
          <div ref={sections.home}><Home onScrollTo={scrollToSection} onOrderNowClick={() => openOrderModal('whatsapp')} isReflecting={isReflecting} onServicesClick={() => setIsServicesPopupOpen(true)} /></div>
          <div ref={sections.portfolio}><Portfolio openModal={openModal} isReflecting={isReflecting} activeTab={activePortfolioTab} setActiveTab={setActivePortfolioTab} activeVfxSubTab={activeVfxSubTab} setActiveVfxSubTab={setActiveVfxSubTab} onStopBotAudio={stopAllSpeaking} onVideoPlaybackChange={setIsVfxVideoPlaying} /></div>
          <div ref={sections.contact}><Contact onEmailClick={() => openOrderModal('email')} isReflecting={isReflecting} /></div>
        </main>
        <div ref={sections.about}><AboutAndFooter isReflecting={isReflecting} /></div>
        {modalState && <ModalViewer state={modalState} onClose={closeModal} onNext={showNext} onPrev={showPrev} />}
        {isGalleryGridOpen && <GalleryGridModal items={GRAPHIC_WORKS} onClose={() => setIsGalleryGridOpen(false)} onImageClick={openSingleImageViewer} />}
        {singleImageViewerState && <ModalViewer state={singleImageViewerState} onClose={() => setSingleImageViewerState(null)} onNext={showNextInSingleImageViewer} onPrev={showPrevInSingleImageViewer} />}
        {isServicesPopupOpen && <ServicesPopup onClose={() => setIsServicesPopupOpen(false)} />}
        {isProfileCardOpen && <ProfileCard onClose={() => setIsProfileCardOpen(false)} />}
        {orderModalState?.isOpen && <OrderModal mode={orderModalState.mode} onClose={() => setOrderModalState(null)} />}
        {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)} onQuickAction={handleQuickActionClick} onGalleryOpen={openGalleryGrid} chatButtonRect={chatButtonRect} />}
      </div>
    </div>
  );
}