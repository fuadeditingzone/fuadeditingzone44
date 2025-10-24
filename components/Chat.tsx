import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon, MicrophoneIcon } from './Icons';
import { PROFILE_PIC_URL } from '../constants';
import type { Language, ChatMessage } from '../types';

interface ChatProps {
    isOpen: boolean;
    onClose: () => void;
    history: ChatMessage[];
    onSendMessage: (message: string) => void;
    isBotTyping: boolean;
    onUserActivity?: () => void;
    currentLanguage: Language | 'auto';
    onLanguageChange: (lang: Language) => void;
    isMuted: boolean;
    muteCountdown: number;
    isVoiceMode: boolean;
    onSetVoiceMode: (isVoiceOn: boolean) => void;
    isAudioPlaying: boolean;
    isLiveSessionActive: boolean;
    onToggleLiveSession: () => void;
}

const LANGUAGES: { code: Language, label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'bn', label: 'BN' },
    { code: 'hi', label: 'HI' },
    { code: 'ur', label: 'UR' },
];

export const Chat = React.forwardRef<HTMLDivElement, ChatProps>(({ isOpen, onClose, history, onSendMessage, isBotTyping, onUserActivity, currentLanguage, onLanguageChange, isMuted, muteCountdown, isVoiceMode, onSetVoiceMode, isAudioPlaying, isLiveSessionActive, onToggleLiveSession }, ref) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [history, isBotTyping]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isMuted && !isLiveSessionActive) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    return (
        <div ref={ref} className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[80] w-[calc(100%-2rem)] max-w-md h-[70vh] origin-bottom-right transition-all duration-300 ease-out ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
            <div className="relative flex flex-col w-full h-full bg-gray-900/80 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
                <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
                    <div className="flex-grow">
                      <h3 className="text-lg font-bold text-white">Chat with Fuad's AI</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-xs text-gray-400">Powered by Gemini</p>
                        <div className="flex items-center gap-1 bg-gray-800 rounded-full p-0.5">
                            {LANGUAGES.map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() => onLanguageChange(lang.code)}
                                    className={`px-2 py-0.5 text-xs font-semibold rounded-full transition-colors ${currentLanguage === lang.code ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                                    aria-label={`Switch to ${lang.label} language`}
                                >
                                    {lang.label}
                                </button>
                            ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-gray-800 rounded-full p-0.5" role="radiogroup" aria-label="Chat Mode">
                            <button
                                onClick={() => onSetVoiceMode(true)}
                                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${isVoiceMode ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                                aria-checked={isVoiceMode}
                                role="radio"
                            >
                                Voice & Text
                            </button>
                            <button
                                onClick={() => onSetVoiceMode(false)}
                                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${!isVoiceMode ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                                aria-checked={!isVoiceMode}
                                role="radio"
                            >
                                Text Only
                            </button>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors" aria-label="Close chat">
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                <div className="flex-grow p-4 overflow-y-auto">
                    {history.map((msg) => (
                        <div key={msg.id} className={`flex items-start gap-3 my-4 ${msg.sender === 'bot' ? '' : 'flex-row-reverse'}`}>
                            {msg.sender === 'bot' && (
                                <img src={PROFILE_PIC_URL} alt="Fuad Ahmed" className="w-8 h-8 rounded-full flex-shrink-0" />
                            )}
                            <div className={`px-4 py-2 rounded-2xl max-w-xs md:max-w-md ${msg.sender === 'bot' ? 'bg-gray-700 text-white rounded-tl-none' : 'bg-red-600 text-white rounded-tr-none'}`}>
                                <div className="flex items-center gap-2">
                                    <span className="break-words">{msg.text}</span>
                                    {msg.sender === 'bot' && !msg.isFinal && (isAudioPlaying || isLiveSessionActive) && (
                                        <div className="waveform shrink-0">
                                            <div className="bar"></div><div className="bar"></div><div className="bar"></div><div className="bar"></div><div className="bar"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isBotTyping && (
                         <div className="flex items-end gap-3 my-4 animate-fade-in">
                            <img src={PROFILE_PIC_URL} alt="Fuad Ahmed" className="w-8 h-8 rounded-full" />
                            <div className="px-4 py-2 rounded-2xl bg-gray-700 rounded-bl-none">
                                <div className="typing-indicator"><span></span><span></span><span></span></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                
                <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={onToggleLiveSession}
                          disabled={isMuted}
                          className={`text-gray-400 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                              isLiveSessionActive
                                  ? 'bg-red-600/20 text-red-500 animate-pulse border border-red-500'
                                  : 'hover:bg-gray-700 hover:text-white'
                          } ${isMuted ? 'cursor-not-allowed opacity-50' : ''}`}
                          aria-label={isLiveSessionActive ? 'Stop live conversation' : 'Start live conversation'}
                        >
                            <MicrophoneIcon className="w-5 h-5" />
                        </button>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => { setInput(e.target.value); onUserActivity?.(); }}
                            placeholder={isMuted ? `Chat is temporarily disabled (${muteCountdown}s)` : isLiveSessionActive ? "Live conversation is active..." : "Ask me anything..."}
                            disabled={isMuted || isLiveSessionActive}
                            className={`flex-grow bg-gray-800 border border-gray-600 rounded-full py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300 ${isMuted || isLiveSessionActive ? 'cursor-not-allowed' : ''} ${isMuted ? 'placeholder:text-yellow-400' : ''}`}
                        />
                        <button type="submit" disabled={isMuted || isLiveSessionActive} className={`bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 btn-glow transition-colors ${isMuted || isLiveSessionActive ? 'bg-gray-600 cursor-not-allowed' : 'hover:bg-red-700'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-90" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
});