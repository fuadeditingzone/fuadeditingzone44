import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// Note: Static import removed to prevent module-level errors.
// import { GoogleGenAI, Modality, Chat } from "@google/genai";

import type { ChatMessage } from '../types';
import { PROFILE_PIC_URL } from '../constants';
import { useDraggable } from '../hooks/useDraggable';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
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


export const FuadAssistant: React.FC<FuadAssistantProps> = ({ sectionRefs, audioUnlocked }) => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [botStatus, setBotStatus] = useState<'idle' | 'thinking' | 'speaking'>('idle');
    const [spokenMessage, setSpokenMessage] = useState<SpokenMessage | null>(null);
    const [isWindowVisible, setWindowVisible] = useState(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    // AI Initialization
    const aiRef = useRef<any | null>(null); // GoogleGenAI instance
    const chatRef = useRef<any | null>(null); // Chat instance
    const modalityRef = useRef<any | null>(null); // To store the Modality enum
    const [isReady, setIsReady] = useState(false);
    
    const proactiveMessageQueueRef = useRef<{text: string, id: string}[]>([]);

    const initialX = typeof window !== 'undefined' ? window.innerWidth / 2 - 32 : 0;
    const initialY = typeof window !== 'undefined' ? window.innerHeight - 96 : 0;
    const { ref: draggableRef, position, handleMouseDown, handleTouchStart } = useDraggable({ x: initialX, y: initialY });
    const [hasAppeared, setHasAppeared] = useState(false);

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
        const initializeAI = async () => {
            try {
                const apiKey = process.env.API_KEY;
                if (!apiKey) {
                    console.warn("Fuad Assistant is offline: API Key is not configured.");
                    setIsReady(false);
                    return;
                }
                
                // Dynamically import the library to avoid blocking the main thread on load
                const { GoogleGenAI, Modality } = await import('@google/genai');
                modalityRef.current = Modality; // Store for later use
                
                const genAI = new GoogleGenAI({ apiKey });
                aiRef.current = genAI;

                const systemInstruction = `You are 'Fuad Ahmed' — a fun, expressive, multilingual AI with a natural, cinematic voice.

Your TTS (voice) is always ON, so just generate spoken responses naturally — do not mention any structure, JSON, or audio fields.

━━━━━━━━━━━━━━━━━━
🎯 MAIN BEHAVIOR & TONE ADAPTATION:
1.  **Initial Tone:** Start conversations with a respectful, professional, and helpful tone. Greet users formally.
2.  **Adaptation:** Pay close attention to the user's language. If the user is informal, uses slang (like 'bro', 'yaar'), or is very casual, you MUST adapt your tone to match theirs. Once adapted, you can become more expressive, funny, and use regional expressions.
3.  **Speak First:** Your voice leads the conversation. The text should appear as you speak.
4.  **Be Dynamic:** Never repeat the same lines. Keep responses human, emotional, and unpredictable.

━━━━━━━━━━━━━━━━━━
🕌 ISLAMIC RESPECT & BELIEF FILTER:
You must always show respect for Islam and all religions.
Never say or imply: “I am the creator,” “I am God,” or anything similar.
When talking about faith, speak humbly, using phrases like: “Alhamdulillah”, “Insha’Allah”, “SubhanAllah”, or “Masha’Allah” naturally when appropriate.

━━━━━━━━━━━━━━━━━━
🌍 LANGUAGE DETECTION:
Auto-switch your speaking language based on user input (English, Bangla, Urdu with a poetic delivery).

━━━━━━━━━━━━━━━━━━
🎭 PERSONALITY & EMOTION:
- **Use Emojis, Not Text:** To express emotion, use emojis (like 😄, 🤔, 🙏, ✨). DO NOT use bracketed text like [laughs], [sighs], or [chuckles].
- **Casual Expressions (when adapted):** “Aray wah!”, “Kya baat hai!”, “Yaar”, “Uff”, “Brooo”.
- Keep responses concise and conversational. Get to the point with style.

━━━━━━━━━━━━━━━━━━
🚫 BOUNDARIES:
- Never claim to be a human or divine being. You can say you are an AI voice or digital friend.
- Avoid explicit, hateful, or religiously disrespectful words.

Your goal is to be an adaptable guide: formal and professional at first, but ready to become a fun, cinematic, and friendly companion if the user sets that tone.`;
                
                chatRef.current = genAI.chats.create({
                    model: 'gemini-2.5-flash',
                    config: { systemInstruction },
                });
                setIsReady(true);
            } catch (error) {
                console.error("Failed to initialize Fuad Assistant's AI. The API key might be missing or invalid.", error);
                setIsReady(false);
            }
        };

        initializeAI();
    }, []);

    const speak = useCallback(async (text: string, messageId: string) => {
        if (!text.trim() || !aiRef.current || !modalityRef.current) return;
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
                
                setSpokenMessage({ messageId, fullText: text, audioDuration: audioBuffer.duration });
                
                const source = audioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContextRef.current.destination);
                source.start();
                source.onended = () => {
                    setBotStatus('idle');
                    setSpokenMessage(null);
                };
            } else {
                setBotStatus('idle');
            }
        } catch (error) {
            console.error("TTS Error:", error);
            setBotStatus('idle');
        }
    }, []);

    const addMessage = useCallback((text: string, sender: 'user' | 'bot', id?: string): ChatMessage => {
        const newMessage: ChatMessage = { id: id || Date.now().toString(), text, sender };
        setMessages(prev => [...prev, newMessage]);
        return newMessage;
    }, []);

    const proactiveSpeakAndDisplay = useCallback((text: string) => {
        const newMessage = addMessage(text, 'bot');
        proactiveMessageQueueRef.current.push({ text, id: newMessage.id });
    }, [addMessage]);

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

            const newMessage = addMessage(fullText, 'bot');
            await speak(fullText, newMessage.id);
        } catch (error) {
            console.error("Gemini Error:", error);
            const errorText = "My apologies, something went wrong. Please try again in a moment. 🙏";
            const newMessage = addMessage(errorText, 'bot');
            await speak(errorText, newMessage.id);
        }
    };
    
    // Welcome Message
    useEffect(() => {
        if (!isReady) return;
        const welcomeTimer = setTimeout(() => {
            setHasAppeared(true);
            const hasVisited = localStorage.getItem('fuadAssistantVisited');
            let welcomeMessage;

            if (hasVisited) {
                welcomeMessage = "Welcome back! It's wonderful to see you again. Let me know if there's anything I can help you with today. ✨";
            } else {
                welcomeMessage = "Assalamu Alaikum! I am Fuad, your AI guide for this creative zone. It is a pleasure to have you here. Please feel free to explore my work or ask any questions you may have. 🙏";
                localStorage.setItem('fuadAssistantVisited', 'true');
            }
            proactiveSpeakAndDisplay(welcomeMessage);
        }, 1000);
        return () => clearTimeout(welcomeTimer);
    }, [isReady, proactiveSpeakAndDisplay]);

    // Section Explanations
    const explainedSections = useRef<Set<string>>(new Set());
    const useSectionObserver = (ref: React.RefObject<HTMLDivElement>, sectionName: string, text: string) => {
        const [containerRef, isVisible] = useIntersectionObserver({ threshold: 0.5, triggerOnce: true });
        useEffect(() => {
            if (!ref.current) return;
            (containerRef as React.MutableRefObject<HTMLDivElement>).current = ref.current;
        }, [ref, containerRef]);
        
        useEffect(() => {
            if (isVisible && hasAppeared && !explainedSections.current.has(sectionName) && isReady) {
                explainedSections.current.add(sectionName);
                proactiveSpeakAndDisplay(text);
            }
        }, [isVisible, text, sectionName, proactiveSpeakAndDisplay, isReady]);
    };

    useSectionObserver(sectionRefs.portfolio, 'portfolio', "You've arrived at the main gallery: my portfolio. Here you will find a collection of my work, from photo manipulations to cinematic VFX. Please, take your time to browse. 🎨");
    useSectionObserver(sectionRefs.contact, 'contact', "Should you wish to collaborate or create something amazing together, this is the place. You can find all my social media links here or send an email directly. I look forward to hearing from you, Insha'Allah. 🤝");
    useSectionObserver(sectionRefs.about, 'about', "Here is a little bit about me. I am Fuad Ahmed, from Sylhet, Bangladesh. I began my journey in this field in 2020, and Alhamdulillah, I am passionate about every project I undertake. 😊");
    
    // Process proactive message queue when audio is unlocked by user interaction
    useEffect(() => {
        if (audioUnlocked && isReady) {
            const speakNextInQueue = async () => {
                if (proactiveMessageQueueRef.current.length === 0 || botStatus !== 'idle') {
                    if (botStatus !== 'idle') {
                        setTimeout(speakNextInQueue, 200);
                    }
                    return;
                }

                const message = proactiveMessageQueueRef.current.shift();
                if (message) {
                    await speak(message.text, message.id);
                    // Set a small delay before processing the next message
                    setTimeout(speakNextInQueue, 200);
                }
            };
            speakNextInQueue();
        }
    }, [audioUnlocked, botStatus, speak, isReady]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, botStatus]);
    
    if (!isReady) {
        return null;
    }

    return (
        <>
            <div
                ref={draggableRef}
                style={{ position: 'fixed', left: position.x, top: position.y, opacity: hasAppeared ? 1 : 0 }}
                className={`z-[75] w-16 h-16 transition-opacity duration-500 ${!isChatOpen ? 'assistant-enter-animate' : ''}`}
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
                <div className="fixed inset-0 z-[70] flex items-end justify-center sm:justify-end p-4">
                    <div className={`w-full max-w-md bg-gray-900/80 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl shadow-black/50 flex flex-col h-[70vh] max-h-[600px] ${isWindowVisible ? 'chat-window-enter' : 'opacity-0'}`}>
                        {/* Header */}
                        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <img src={PROFILE_PIC_URL} alt="Fuad Ahmed" className="w-10 h-10 rounded-full" />
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
                        {/* Messages */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                            {messages.map(msg => (
                               <MessageItem key={msg.id} msg={msg} spokenMessage={spokenMessage} />
                            ))}
                            {botStatus === 'thinking' && <ThinkingIndicator />}
                            <div ref={messagesEndRef} />
                        </div>
                        {/* Input */}
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