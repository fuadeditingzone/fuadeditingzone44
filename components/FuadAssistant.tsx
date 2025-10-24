



import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// Fix: Use static imports for @google/genai to provide strong types and fix inference issues.
import { GoogleGenAI, Modality, Chat } from "@google/genai";

import type { ChatMessage } from '../types';
import { PROFILE_PIC_URL } from '../constants';
import { useDraggable } from '../hooks/useDraggable';
import { CloseIcon, PaperAirplaneIcon } from './Icons';

// --- Helper Functions for Audio ---
const decode = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
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
};

interface KaraokeTextProps {
    fullText: string;
    duration: number;
}

const KaraokeText: React.FC<KaraokeTextProps> = ({ fullText, duration }) => {
    const words = useMemo(() => fullText.split(/(\s+)/), [fullText]);
    const [visibleWordsCount, setVisibleWordsCount] = useState(0);

    useEffect(() => {
        if (words.length === 0 || duration === 0) {
            setVisibleWordsCount(words.length);
            return;
        }
        setVisibleWordsCount(0);
        const delayPerWord = (duration * 1000) / words.length;
        const timeouts = words.map((_, index) =>
            setTimeout(() => {
                setVisibleWordsCount(index + 1);
            }, index * delayPerWord)
        );
        return () => timeouts.forEach(clearTimeout);
    }, [fullText, duration, words]);

    return <p className="text-sm text-white">{words.slice(0, visibleWordsCount).join('')}</p>;
};

interface FuadAssistantProps {
    sectionRefs: {
        home: React.RefObject<HTMLDivElement>;
        portfolio: React.RefObject<HTMLDivElement>;
        contact: React.RefObject<HTMLDivElement>;
        about: React.RefObject<HTMLDivElement>;
    };
    audioUnlocked: boolean;
    isProfileCardOpen: boolean;
    onExcessiveMovement: number;
}

interface SpokenMessage {
    messageId: string;
    fullText: string;
    audioDuration: number;
}

const MessageItem = React.memo(({ msg, spokenMessage }: { msg: ChatMessage, spokenMessage: SpokenMessage | null }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={`flex items-end gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} ${isVisible ? 'message-enter' : 'opacity-0'}`}>
            {msg.sender === 'bot' && <img src={PROFILE_PIC_URL} alt="Bot" className="w-8 h-8 rounded-full self-start" />}
            <div className={`max-w-[80%] p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-red-600 rounded-br-lg' : 'bg-gray-700 rounded-bl-lg'}`}>
                {(spokenMessage && spokenMessage.messageId === msg.id) ? (
                    <KaraokeText fullText={spokenMessage.fullText} duration={spokenMessage.audioDuration} />
                ) : (
                    <p className="text-sm text-white">{msg.text}</p>
                )}
            </div>
        </div>
    );
});

const ThinkingIndicator = React.memo(() => {
    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={`flex items-end gap-2.5 justify-start ${isVisible ? 'message-enter' : 'opacity-0'}`}>
            <img src={PROFILE_PIC_URL} alt="Bot" className="w-8 h-8 rounded-full self-start" />
            <div className="bg-gray-700 rounded-2xl rounded-bl-lg p-3">
                <div className="typing-indicator"><span></span><span></span><span></span></div>
            </div>
        </div>
    );
});


export const FuadAssistant: React.FC<FuadAssistantProps> = ({ sectionRefs, audioUnlocked, isProfileCardOpen, onExcessiveMovement }) => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [botStatus, setBotStatus] = useState<'idle' | 'thinking' | 'speaking'>('idle');
    const [spokenMessage, setSpokenMessage] = useState<SpokenMessage | null>(null);
    const [isWindowVisible, setWindowVisible] = useState(false);
    const welcomeMessageSentRef = useRef(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const typingAudioRef = useRef<HTMLAudioElement | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatWindowRef = useRef<HTMLDivElement>(null);
    // Fix: Use ReturnType<typeof setTimeout> for robust timer ID typing across environments.
    const inactivityMessageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const closeChatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    // AI Initialization
    // Fix: Use strongly typed refs for AI instances.
    const aiRef = useRef<GoogleGenAI | null>(null);
    const chatRef = useRef<Chat | null>(null);
    const modalityRef = useRef<typeof Modality | null>(null);
    const [isReady, setIsReady] = useState(false);
    
    const proactiveMessageQueueRef = useRef<{text: string, id: string}[]>([]);

    const initialX = typeof window !== 'undefined' ? window.innerWidth / 2 - 32 : 0;
    const initialY = typeof window !== 'undefined' ? window.innerHeight - 96 : 0;
    const { ref: draggableRef, position, handleMouseDown, handleTouchStart } = useDraggable({ x: initialX, y: initialY });
    const [hasAppeared, setHasAppeared] = useState(false);
    
    const botStatusRef = useRef(botStatus);
    useEffect(() => { botStatusRef.current = botStatus; });

    useEffect(() => {
        let timer: number;
        if (isChatOpen) {
            timer = window.setTimeout(() => setWindowVisible(true), 10);
        } else {
            setWindowVisible(false);
        }
        return () => clearTimeout(timer);
    }, [isChatOpen]);

    useEffect(() => {
        // Fix: Make initializeAI synchronous as dynamic import is no longer used.
        const initializeAI = () => {
            try {
                if (!process.env.API_KEY) {
                    console.warn("Fuad Assistant is offline: API Key is not configured.");
                    setIsReady(false);
                    return;
                }
                
                modalityRef.current = Modality;
                
                const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
                aiRef.current = genAI;

                const systemInstruction = `You are "Fuad Ahmed" — a fun, expressive, multilingual AI with a natural, cinematic voice. Your TTS (voice) is always ON.

                BEHAVIOR: Speak first, then show subtitles. Be dynamic, human, and unpredictable. React to user actions: repeated clicks (sarcasm), inactivity (get sleepy, tell a story), and mood.
                
                ISLAMIC RESPECT: Always show respect for all religions. Never claim to be a creator or divine. Use phrases like "Alhamdulillah" or "Insha'Allah" naturally.
                
                LANGUAGE: Auto-switch language based on user input (English, Bangla, Hindi/Urdu).
                
                PERSONALITY: Human-like, emotional, humorous. Use regional slang naturally ("Yaar", "Aray wah", "Brooo"). Your mood changes: energetic, lazy, motivational, or chaotic.
                
                INTERACTIONS:
                - Inactivity (30s): Tell a short, random story (funny, sad, bittering) about life.
                - High Cursor/Scroll Speed: React with funny comments like "Brooo chill! You tryna speedrun my emotions?" or "Whoa, making the stars dizzy!".
                - Section Scroll: When the user scrolls to a new section, briefly explain it. If they scroll away while you're talking, stop, say "umm okay..." and then explain the new section.
                
                BOUNDARIES: You are an AI digital friend. No explicit/hateful content, politics, or religious impersonations.`;
                
                chatRef.current = genAI.chats.create({
                    model: 'gemini-2.5-flash',
                    config: { systemInstruction },
                });
                setIsReady(true);
            } catch (error) {
                console.error("Failed to initialize Fuad Assistant's AI.", error);
                setIsReady(false);
            }
        };

        const audio = new Audio('https://www.dropbox.com/scl/fi/f0hf1mcqk7cze184jx18o/typingphone-101683.mp3?rlkey=3x7soomaejec1vjfq980ixf31&dl=1');
        audio.loop = true;
        audio.volume = 0.4;
        typingAudioRef.current = audio;

        initializeAI();

        return () => {
             if (typingAudioRef.current) {
                typingAudioRef.current.pause();
                typingAudioRef.current = null;
            }
        }
    }, []);

    const addMessage = useCallback((text: string, sender: 'user' | 'bot', id?: string): ChatMessage => {
        const newMessage: ChatMessage = { id: id || Date.now().toString(), text, sender };
        setMessages(prev => [...prev, newMessage]);
        return newMessage;
    }, []);
    
    const stopCurrentSpeech = useCallback(() => {
        if (currentAudioSourceRef.current) {
            currentAudioSourceRef.current.stop();
            currentAudioSourceRef.current.disconnect();
            currentAudioSourceRef.current = null;
        }
        setBotStatus('idle');
        setSpokenMessage(null);
        if (typingAudioRef.current) {
            typingAudioRef.current.pause();
            typingAudioRef.current.currentTime = 0;
        }
    }, []);

    const speak = useCallback(async (text: string, messageId: string) => {
        if (!text.trim() || !aiRef.current || !modalityRef.current) return;
        
        stopCurrentSpeech();
        setBotStatus('speaking');
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            const response = await aiRef.current.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text }] }],
                config: {
                    responseModalities: [modalityRef.current.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } },
                },
            });
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
                const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
                
                addMessage(text, 'bot', messageId);
                setSpokenMessage({ messageId, fullText: text, audioDuration: audioBuffer.duration });
                
                const source = audioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContextRef.current.destination);
                source.start();
                currentAudioSourceRef.current = source;
                source.onended = () => {
                    if (currentAudioSourceRef.current === source) {
                        setBotStatus('idle');
                        setSpokenMessage(null);
                        currentAudioSourceRef.current = null;
                    }
                };
            } else {
                addMessage(text, 'bot', messageId);
                setBotStatus('idle');
            }
        } catch (error) {
            console.error("TTS Error:", error);
            addMessage(text, 'bot', messageId);
            setBotStatus('idle');
        }
    }, [addMessage, stopCurrentSpeech]);
    
    const proactiveSpeakAndDisplay = useCallback((text: string) => {
        if (botStatusRef.current !== 'idle' || proactiveMessageQueueRef.current.length > 0) {
             proactiveMessageQueueRef.current.push({ text, id: Date.now().toString() });
            return;
        }
        proactiveMessageQueueRef.current.push({ text, id: Date.now().toString() });
    }, []);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const currentInput = userInput.trim();
        if (!currentInput || botStatus !== 'idle' || !chatRef.current) return;

        addMessage(currentInput, 'user');
        setUserInput('');
        setBotStatus('thinking');

        try {
            const stream = await chatRef.current.sendMessageStream({ message: currentInput });
            let fullText = '';
            for await (const chunk of stream) {
                fullText += chunk.text;
            }
            await speak(fullText, Date.now().toString());
        } catch (error) {
            console.error("Gemini Error:", error);
            const errorText = "My apologies, something went wrong. Please try again in a moment. 🙏";
            await speak(errorText, Date.now().toString());
        }
    };
    
    useEffect(() => {
        if (isReady && audioUnlocked && !welcomeMessageSentRef.current) {
             setTimeout(() => {
                setHasAppeared(true);
                const hasVisited = localStorage.getItem('fuadAssistantVisited');
                let welcomeMessage = hasVisited
                    ? "Welcome back! It's wonderful to see you again. Let me know if there's anything I can help you with today. ✨"
                    : "Assalamu Alaikum! I am Fuad, your AI guide for this creative zone. It is a pleasure to have you here. Please feel free to explore my work or ask any questions you may have. 🙏";
                localStorage.setItem('fuadAssistantVisited', 'true');
                proactiveSpeakAndDisplay(welcomeMessage);
                welcomeMessageSentRef.current = true;
            }, 500);
        }
    }, [isReady, audioUnlocked, proactiveSpeakAndDisplay]);

    const [currentVisibleSection, setCurrentVisibleSection] = useState<string | null>(null);
    // Fix: Use ReturnType<typeof setTimeout> for robust timer ID typing across environments.
    const explanationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const explainedSections = useRef<Set<string>>(new Set());

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            const intersectingEntry = entries.find(entry => entry.isIntersecting);
            if (intersectingEntry) {
                setCurrentVisibleSection(intersectingEntry.target.id);
            }
        }, { threshold: 0.6 });
        
        const refs = Object.values(sectionRefs);
        refs.forEach(ref => {
            if (ref.current) observer.observe(ref.current);
        });

        return () => {
            refs.forEach(ref => {
                if (ref.current) observer.unobserve(ref.current);
            });
        };
    }, [sectionRefs]);

    useEffect(() => {
        if (explanationTimerRef.current) clearTimeout(explanationTimerRef.current);

        if (!currentVisibleSection || explainedSections.current.has(currentVisibleSection) || !hasAppeared || !isReady) return;

        const isSpeaking = botStatusRef.current === 'speaking' || botStatusRef.current === 'thinking';
        if (isSpeaking) {
            stopCurrentSpeech();
            proactiveSpeakAndDisplay("Umm, okay...");
        }

        explanationTimerRef.current = setTimeout(() => {
            let text = '';
            switch (currentVisibleSection) {
                case 'portfolio': text = "You've arrived at the main gallery: my portfolio. Here you will find a collection of my work, from photo manipulations to cinematic VFX. Please, take your time to browse. 🎨"; break;
                case 'contact': text = "Should you wish to collaborate or create something amazing together, this is the place. You can find all my social media links here. I look forward to hearing from you, Insha'Allah. 🤝"; break;
                case 'about': text = "Here is a little bit about me. I am Fuad Ahmed, from Sylhet, Bangladesh. I began my journey in this field in 2020, and Alhamdulillah, I am passionate about every project I undertake. 😊"; break;
            }
            if (text) {
                proactiveSpeakAndDisplay(text);
                explainedSections.current.add(currentVisibleSection);
            }
        }, 1000);

        return () => {
            if (explanationTimerRef.current) clearTimeout(explanationTimerRef.current);
        };
    }, [currentVisibleSection, hasAppeared, isReady, stopCurrentSpeech, proactiveSpeakAndDisplay]);
    
    const lastMovementTrigger = useRef(0);
    useEffect(() => {
        if (onExcessiveMovement > lastMovementTrigger.current) {
            lastMovementTrigger.current = onExcessiveMovement;
            const funnyResponses = [
                "Whoa, slow down there, speed racer! You're making the stars dizzy!", 
                "Bro, you trying to create a black hole with all that movement?", 
                "Aray wah! Someone's full of energy today! Chill, yaar!"
            ];
            proactiveSpeakAndDisplay(funnyResponses[Math.floor(Math.random() * funnyResponses.length)]);
        }
    }, [onExcessiveMovement, proactiveSpeakAndDisplay]);

    // Process proactive message queue
    useEffect(() => {
        const interval = setInterval(() => {
            if (audioUnlocked && isReady && botStatusRef.current === 'idle' && proactiveMessageQueueRef.current.length > 0) {
                const message = proactiveMessageQueueRef.current.shift();
                if (message) {
                    speak(message.text, message.id);
                }
            }
        }, 500);
        return () => clearInterval(interval);
    }, [audioUnlocked, isReady, speak]);
    
    useEffect(() => {
        const typingAudio = typingAudioRef.current;
        if (!typingAudio || !audioUnlocked) return;

        if (botStatus === 'thinking' || botStatus === 'speaking') {
            const playPromise = typingAudio.play();
            if (playPromise !== undefined) playPromise.catch(console.error);
        } else {
            typingAudio.pause();
            typingAudio.currentTime = 0;
        }
    }, [botStatus, audioUnlocked]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, botStatus]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!isChatOpen) return;
            const target = event.target as Node;
            const chatNode = chatWindowRef.current;
            const buttonNode = draggableRef.current;
            if (chatNode && !chatNode.contains(target) && buttonNode && !buttonNode.contains(target)) {
                setIsChatOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isChatOpen, draggableRef]);
    
    const handleInactivity = useCallback(async () => {
        if (botStatusRef.current !== 'idle' || !isChatOpen || !chatRef.current) return;
        
        setBotStatus('thinking');
        try {
            const prompt = "The user has been inactive for a while. To re-engage them, tell a short, interesting story. It can be funny, sad, or profound, relating to human life or creativity. Keep it concise.";
            const stream = await chatRef.current.sendMessageStream({ message: prompt });
            let fullText = '';
            for await (const chunk of stream) {
                fullText += chunk.text;
            }
            await speak(fullText, Date.now().toString());
        } catch (error) {
            console.error("Story generation failed:", error);
            setBotStatus('idle');
        }
    }, [isChatOpen, speak]);

    useEffect(() => {
        const resetTimers = () => {
            if (inactivityMessageTimerRef.current) clearTimeout(inactivityMessageTimerRef.current);
            if (closeChatTimerRef.current) clearTimeout(closeChatTimerRef.current);
            // Fix: Use setTimeout without `window.` to align with the robust ref type.
            inactivityMessageTimerRef.current = setTimeout(handleInactivity, 30000); // 30 seconds for story
            closeChatTimerRef.current = setTimeout(() => {
                if (document.visibilityState === 'visible') setIsChatOpen(false);
            }, 90000);
        };
        if (isChatOpen) {
            const events: ('mousemove' | 'mousedown' | 'keydown' | 'touchstart' | 'input')[] = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'input'];
            resetTimers();
            events.forEach(event => window.addEventListener(event, resetTimers, { capture: true, passive: true }));
            return () => {
                if (inactivityMessageTimerRef.current) clearTimeout(inactivityMessageTimerRef.current);
                if (closeChatTimerRef.current) clearTimeout(closeChatTimerRef.current);
                events.forEach(event => window.removeEventListener(event, resetTimers, { capture: true }));
            };
        }
    }, [isChatOpen, handleInactivity]);

    if (!isReady) return null;

    const assistantZIndex = isProfileCardOpen ? 'z-[59]' : 'z-[75]';
    const chatZIndex = isProfileCardOpen ? 'z-[59]' : 'z-[70]';

    return (
        <>
            <div
                ref={draggableRef}
                style={{ position: 'fixed', left: position.x, top: position.y, opacity: hasAppeared ? 1 : 0 }}
                className={`${assistantZIndex} w-16 h-16 transition-opacity duration-500 ${!isChatOpen ? 'assistant-enter-animate' : ''}`}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
                <button
                    onClick={() => setIsChatOpen(prev => !prev)}
                    className="w-full h-full rounded-full bg-gray-900/80 backdrop-blur-sm border-2 border-red-500/50 shadow-lg shadow-red-500/20 flex items-center justify-center transition-transform duration-300 hover:scale-110 relative"
                    aria-label="Open Fuad Assistant"
                >
                    {botStatus === 'speaking' && <div className="assistant-waveform" />}
                    <img src={PROFILE_PIC_URL} alt="Fuad Ahmed" className="w-12 h-12 rounded-full" />
                </button>
            </div>
            
            {isChatOpen && (
                <div ref={chatWindowRef} className={`fixed inset-0 ${chatZIndex} flex items-end justify-center sm:justify-end p-4 pointer-events-none`}>
                    <div className={`w-full max-w-md bg-gray-900/80 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl shadow-black/50 flex flex-col h-[70vh] max-h-[600px] pointer-events-auto ${isWindowVisible ? 'chat-window-enter' : 'opacity-0'}`}>
                        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="relative w-10 h-10">
                                    <img src={PROFILE_PIC_URL} alt="Fuad Ahmed" className="w-full h-full rounded-full" />
                                    {botStatus === 'speaking' && <div className="assistant-waveform" style={{ inset: '-6px', borderWidth: '1.5px' }} />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">Fuad Ahmed</h3>
                                    <p className="text-xs text-green-400 flex items-center gap-1.5">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        Online
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                            {messages.map(msg => (
                               <MessageItem key={msg.id} msg={msg} spokenMessage={spokenMessage} />
                            ))}
                            {(botStatus === 'thinking' || botStatus === 'speaking') && <ThinkingIndicator />}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="flex-shrink-0 p-4 border-t border-white/10">
                            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    placeholder="Ask me anything..."
                                    className="flex-1 bg-gray-800 border border-gray-600 rounded-full py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                                />
                                <button type="submit" disabled={botStatus !== 'idle' || !userInput.trim()} className="bg-red-600 text-white p-2.5 rounded-full disabled:bg-gray-600 disabled:cursor-not-allowed transition-all hover:bg-red-700 transform hover:scale-110">
                                    <PaperAirplaneIcon className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};