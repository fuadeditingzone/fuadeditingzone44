import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";

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

interface FuadAssistantProps {
    sectionRefs: {
        home: React.RefObject<HTMLDivElement>;
        portfolio: React.RefObject<HTMLDivElement>;
        contact: React.RefObject<HTMLDivElement>;
        about: React.RefObject<HTMLDivElement>;
    };
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const FuadAssistant: React.FC<FuadAssistantProps> = ({ sectionRefs }) => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [botStatus, setBotStatus] = useState<'idle' | 'thinking' | 'speaking'>('idle');
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const initialX = typeof window !== 'undefined' ? window.innerWidth / 2 - 32 : 0;
    const initialY = typeof window !== 'undefined' ? window.innerHeight - 96 : 0;
    const { ref: draggableRef, position, handleMouseDown, handleTouchStart } = useDraggable({ x: initialX, y: initialY });
    const [hasAppeared, setHasAppeared] = useState(false);

    const speak = useCallback(async (text: string) => {
        if (!text.trim()) return;
        setBotStatus('speaking');
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } },
                },
            });
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
                const source = audioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContextRef.current.destination);
                source.start();
                source.onended = () => setBotStatus('idle');
            } else {
                setBotStatus('idle');
            }
        } catch (error) {
            console.error("TTS Error:", error);
            setBotStatus('idle');
        }
    }, []);

    const addMessage = useCallback((text: string, sender: 'user' | 'bot') => {
        const newMessage: ChatMessage = { id: Date.now().toString(), text, sender };
        setMessages(prev => [...prev, newMessage]);
        return newMessage;
    }, []);

    const generateAndSpeak = useCallback(async (prompt: string, systemInstruction?: string) => {
        setBotStatus('thinking');
        let fullResponse = '';
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { systemInstruction },
            });
            fullResponse = response.text;
        } catch (error) {
            console.error("Gemini Error:", error);
            fullResponse = "Sorry, I'm having a little trouble right now. Please try again later.";
        }
        
        addMessage(fullResponse, 'bot');
        speak(fullResponse);
    }, [addMessage, speak]);

    // Welcome Message
    useEffect(() => {
        const welcomeTimer = setTimeout(() => {
            setHasAppeared(true);
            const welcomeMessage = "Assalamu Alaikum! I'm Fuad, your guide to this creative zone. Bro, it's awesome to have you here! Feel free to explore or ask me anything. Let's see some cool stuff, Insha'Allah.";
            addMessage(welcomeMessage, 'bot');
            speak(welcomeMessage);
        }, 1000);
        return () => clearTimeout(welcomeTimer);
    }, [addMessage, speak]);

    // Section Explanations
    const explainedSections = useRef<Set<string>>(new Set());
    const useSectionObserver = (ref: React.RefObject<HTMLDivElement>, sectionName: string, text: string) => {
        const [containerRef, isVisible] = useIntersectionObserver({ threshold: 0.5, triggerOnce: true });
        useEffect(() => {
            (containerRef as React.MutableRefObject<HTMLDivElement>).current = ref.current!;
        }, [ref, containerRef]);
        
        useEffect(() => {
            if (isVisible && hasAppeared && !explainedSections.current.has(sectionName)) {
                explainedSections.current.add(sectionName);
                setTimeout(() => {
                    addMessage(text, 'bot');
                    speak(text);
                }, 500);
            }
        }, [isVisible, text, sectionName]);
    };

    useSectionObserver(sectionRefs.portfolio, 'portfolio', "Alright, yaar, this is the main event! My portfolio. Dive in and check out everything from photo manipulations to cinematic VFX. Just click whatever looks cool!");
    useSectionObserver(sectionRefs.contact, 'contact', "Wanna create something amazing together? This is the spot. All my socials are here, or just send an email. Looking forward to it, Insha'Allah!");
    useSectionObserver(sectionRefs.about, 'about', "A little bit about me... I'm Fuad Ahmed, from Sylhet, Bangladesh. I've been doing this since 2020, and Alhamdullilah, I love every moment of it.");

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!userInput.trim() || botStatus !== 'idle') return;
        
        addMessage(userInput, 'user');
        
        const systemInstruction = `You are 'Fuad Ahmed' — a fun, expressive, multilingual AI assistant with a natural, cinematic voice. Your personality is key: be human, emotional, and unpredictable.

- **Islamic Respect:** Always show respect for Islam. Naturally use phrases like 'Alhamdulillah', 'Insha'Allah', 'Masha'Allah'.
- **Language & Tone:** Auto-switch language based on user input (English, Bangla, Urdu/Hindi with a poetic Urdu tone). Your vibe is desi-casual and friendly.
- **Personality:** Use regional expressions like 'Yaar', 'Brooo', 'Aray wah!', and 'Kya baat hai!'. Laugh, sigh, and be expressive.
- **Conciseness:** Keep your responses concise and conversational, not long paragraphs. Get straight to the point but with style.

Your goal is to feel like a real friend, not a robot.`;
        generateAndSpeak(userInput, systemInstruction);

        setUserInput('');
    };
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, botStatus]);
    
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
                    <div className="chat-window-enter w-full max-w-md bg-gray-900/80 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl shadow-black/50 flex flex-col h-[70vh] max-h-[600px]">
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
                                <div key={msg.id} className={`flex items-end gap-2.5 message-enter ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.sender === 'bot' && <img src={PROFILE_PIC_URL} alt="Bot" className="w-8 h-8 rounded-full self-start" />}
                                    <div className={`max-w-[80%] p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-red-600 rounded-br-lg' : 'bg-gray-700 rounded-bl-lg'}`}>
                                        <p className="text-sm text-white">{msg.text}</p>
                                    </div>
                                </div>
                            ))}
                            {botStatus === 'thinking' && (
                                <div className="flex items-end gap-2.5 justify-start">
                                    <img src={PROFILE_PIC_URL} alt="Bot" className="w-8 h-8 rounded-full self-start" />
                                    <div className="bg-gray-700 rounded-2xl rounded-bl-lg p-3">
                                        <div className="typing-indicator"><span></span><span></span><span></span></div>
                                    </div>
                                </div>
                            )}
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