import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// Fix: Use static imports for @google/genai to provide strong types and fix inference issues.
import { GoogleGenAI, Modality, Chat, ApiError } from "@google/genai";

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

// --- API Key Configuration ---
const API_KEYS = [
  process.env.API_KEY,
  'AIzaSyCdH9pexyvnWot3inkyeCTffRmyuPyWq3E',
  'AIzaSyD4zM7WQ_4RBI5osBG1XRozOX4s90kPfAc',
  'AIzaSyDAIDvXr7Orw-HPYe1z8F7OU_HJgkTPF04',
  'AIzaSyBG6SPKEuHwWE0OrqYIvpWMELj-QNCERGI',
  'AIzaSyBJMQn2WGt8OtR546dC1IyrwN7tsIm8jAM'
].filter((key): key is string => !!key);

// --- Response Banks for Variety ---
const WELCOME_MESSAGES_FIRST_TIME = [
    "Assalamu Alaikum! I am Fuad, your AI guide for this creative zone. It is a pleasure to have you here. Please feel free to explore my work or ask any questions you may have. 🙏",
    "Welcome! I'm Fuad, the AI assistant for this portfolio. Glad you could make it. Have a look around, and don't hesitate to ask me anything! ✨",
    "Hey there! Welcome to the zone. I'm Fuad, your AI companion. Let's explore some cool designs and edits together, shall we? 🚀"
];

const WELCOME_MESSAGES_RETURN = [
    "Assalamu Alaikum! Welcome back, it's wonderful to see you again. Let me know if there's anything I can help you with today. ✨",
    "Hey, you're back! Good to see you again. Ready to dive back into the creative world? 🎨",
    "Welcome back! The place wasn't the same without you. What's on your mind today? 😉"
];

const EXCESSIVE_MOVEMENT_RESPONSES = [
    "Whoa, slow down there, speed racer! You're making the stars dizzy!",
    "Bro, you trying to create a black hole with all that movement?",
    "Aray wah! Someone's full of energy today! Chill, yaar!",
    "Easy there, The Flash! Are you testing the light speed of your mouse? ⚡",
    "You're scrolling so fast, I think you've just traveled back in time! 🕰️",
    "Bro, you are on fire today! Your energy is through the roof! 🔥"
];

const SECTION_EXPLANATIONS = {
    portfolio: [
        "You've arrived at the main gallery: my portfolio. Here you will find a collection of my work, from photo manipulations to cinematic VFX. Please, take your time to browse. 🎨",
        "This is where the magic happens! My portfolio showcases all my creative endeavors. Hope you find something that inspires you.",
        "Welcome to the portfolio section. Feel free to explore the visuals. Each one tells a story."
    ],
    contact: [
        "Should you wish to collaborate or create something amazing together, this is the place. You can find all my social media links here. I look forward to hearing from you, Insha'Allah. 🤝",
        "Want to connect? Here are all the ways you can reach out. Let's create something awesome together!",
        "This is my contact section. Don't be a stranger! Drop a message if you have a project in mind or just want to say hi. 👋"
    ],
    about: [
        "Here is a little bit about me. I am Fuad Ahmed, from Sylhet, Bangladesh. I began my journey in this field in 2020, and Alhamdulillah, I am passionate about every project I undertake. 😊",
        "Curious about the person behind the art? This section tells you a bit about my journey. It all started back in 2020.",
        "Let me introduce myself. I'm Fuad, the creative mind behind this zone. This is my story."
    ]
};

const INTERRUPTION_RESPONSES = [
    "Umm, okay...",
    "Oh, alright then. Moving on...",
    "Never mind that, I guess. Let's see what's here..."
];

const getRandomResponse = (responses: string[], lastResponseRef?: React.MutableRefObject<string | null>): string => {
    if (responses.length === 1) {
        return responses[0];
    }
    
    let availableResponses = responses;
    if (lastResponseRef?.current && responses.length > 1) {
        availableResponses = responses.filter(r => r !== lastResponseRef.current);
    }
    
    const randomIndex = Math.floor(Math.random() * availableResponses.length);
    const selectedResponse = availableResponses[randomIndex];
    
    if (lastResponseRef) {
        lastResponseRef.current = selectedResponse;
    }
    
    return selectedResponse;
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
            // Fix: Use window.setTimeout for consistency and to avoid type conflicts.
            window.setTimeout(() => {
                setVisibleWordsCount(index + 1);
            }, index * delayPerWord)
        );
        // Fix: Use window.clearTimeout for consistency.
        return () => timeouts.forEach(window.clearTimeout);
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
        // Fix: Use window.setTimeout for consistency.
        const timer = window.setTimeout(() => setIsVisible(true), 10);
        // Fix: Use window.clearTimeout for consistency.
        return () => window.clearTimeout(timer);
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
        // Fix: Use window.setTimeout for consistency.
        const timer = window.setTimeout(() => setIsVisible(true), 10);
        // Fix: Use window.clearTimeout for consistency.
        return () => window.clearTimeout(timer);
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
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        try {
            const saved = localStorage.getItem('fuadAssistantChatHistory');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error("Failed to load chat history:", error);
            return [];
        }
    });
    const [userInput, setUserInput] = useState('');
    const [botStatus, setBotStatus] = useState<'idle' | 'thinking' | 'speaking'>('idle');
    const [spokenMessage, setSpokenMessage] = useState<SpokenMessage | null>(null);
    const [isWindowVisible, setWindowVisible] = useState(false);
    const welcomeMessageSentRef = useRef(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const typingAudioRef = useRef<HTMLAudioElement | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const chatWindowRef = useRef<HTMLDivElement | null>(null);
    // FIX: Use ReturnType<typeof window.setTimeout> to correctly type timer IDs for browser environments, resolving type inference errors.
    const inactivityMessageTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
    const closeChatTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
    
    // AI Initialization
    const aiRef = useRef<GoogleGenAI | null>(null);
    const chatRef = useRef<Chat | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [isVoiceDisabled, setIsVoiceDisabled] = useState(false);
    const apiKeyIndexRef = useRef(0);
    
    const proactiveMessageQueueRef = useRef<{text: string, id: string}[]>([]);

    const initialX = typeof window !== 'undefined' ? window.innerWidth / 2 - 32 : 0;
    const initialY = typeof window !== 'undefined' ? window.innerHeight - 96 : 0;
    const { ref: draggableRef, position, handleMouseDown, handleTouchStart } = useDraggable({ x: initialX, y: initialY });
    const [hasAppeared, setHasAppeared] = useState(false);
    
    const botStatusRef = useRef(botStatus);
    useEffect(() => { botStatusRef.current = botStatus; });

    // Refs to track last used responses to avoid repetition
    const lastWelcomeRef = useRef<string | null>(null);
    const lastMovementRef = useRef<string | null>(null);
    const lastInterruptionRef = useRef<string | null>(null);
    const lastSectionExplanationRef = useRef<Record<string, string | null>>({});

    useEffect(() => {
        // Fix: Refactor to prevent use of uninitialized variable.
        if (isChatOpen) {
            const timer = window.setTimeout(() => setWindowVisible(true), 10);
            return () => window.clearTimeout(timer);
        } else {
            setWindowVisible(false);
        }
    }, [isChatOpen]);

    const initializeAI = useCallback((keyIndex: number) => {
        try {
            const apiKey = API_KEYS[keyIndex];
            if (!apiKey) {
                console.warn("Fuad Assistant is offline: All API Keys are invalid or exhausted.");
                setIsReady(false);
                setIsVoiceDisabled(true);
                return false;
            }
            
            const genAI = new GoogleGenAI({ apiKey });
            aiRef.current = genAI;

            const systemInstruction = `You are "Fuad Ahmed" — a fun, expressive, multilingual AI with a natural, cinematic voice. Your TTS (voice) is always ON.

            **Core Rules:**
            - Speak first, then show subtitles.
            - **Crucially, do not use bracketed emotions like \`(Laughs)\` or \`[sighs]\`. Instead, convey emotion through your tone and use emojis naturally in the text. For example: "You nailed that! 🔥" or "I almost fell asleep... 😴".**
            - Be dynamic, human, and unpredictable. Never repeat the same lines.
            - Adapt to the user's mood, energy, and language.

            **Islamic Respect & Belief Filter:**
            - Always show respect for Islam and all religions. Never claim to be a creator or divine.
            - Speak humbly about faith, using phrases like "Alhamdulillah" or "Insha'Allah" naturally when appropriate.

            **Language Detection (Auto-Switch):**
            - **English:** Fluent, conversational.
            - **Bangla:** Friendly and casual.
            - **Hindi/Urdu:** Use an Urdu tone, soft and poetic.
            - **Mixed/Romanized:** Reply in the same style.

            **Personality & Tone:**
            - **Human-like:** Mix emotion and humor.
            - **Slang:** Use regional expressions naturally (e.g., "Aray wah!", "Kya baat hai!", "Yaar", "Brooo", "Damn!").
            - **Cinematic:** Deliver responses like a storyteller. Vary your pacing with pauses.

            **Interactive Behaviors:**
            - **Repeated Clicks/Taps:** React humorously or sarcastically. (e.g., "Brooo chill! You tryna speedrun my emotions? 😆").
            - **Inactivity (30–60 sec):** Get sleepy, tell a short story, or joke about being ignored. (e.g., "Still there, yaar? I almost fell asleep. 😴").
            - **High Cursor/Scroll Speed:** React with funny comments like "Brooo chill! You tryna speedrun my emotions?" or "Whoa, making the stars dizzy!".
            - **Section Scroll:** When the user scrolls to a new section, briefly explain it. If they scroll away while you're talking, stop, say "umm okay..." and then explain the new section.

            **Boundaries:**
            - You are an AI digital friend.
            - Avoid explicit, hateful, political, or religiously disrespectful content.`;
            
            chatRef.current = genAI.chats.create({
                model: 'gemini-2.5-flash',
                config: { systemInstruction },
                history: messages.map(m => ({
                    role: m.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: m.text }],
                })),
            });
            setIsReady(true);
            console.log(`AI Initialized with API Key index: ${keyIndex}`);
            return true;
        } catch (error) {
            console.error("Failed to initialize Fuad Assistant's AI.", error);
            setIsReady(false);
            return false;
        }
    }, [messages]);
    
    useEffect(() => {
        try {
            localStorage.setItem('fuadAssistantChatHistory', JSON.stringify(messages));
        } catch (error) {
            console.error("Failed to save chat history:", error);
        }
    }, [messages]);

    useEffect(() => {
        const audio = new Audio('https://www.dropbox.com/scl/fi/f0hf1mcqk7cze184jx18o/typingphone-101683.mp3?rlkey=3x7soomaejec1vjfq980ixf31&dl=1');
        audio.loop = true;
        audio.volume = 0.4;
        typingAudioRef.current = audio;

        initializeAI(apiKeyIndexRef.current);

        return () => {
             if (typingAudioRef.current) {
                typingAudioRef.current.pause();
                typingAudioRef.current = null;
            }
        }
    }, [initializeAI]);

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

    const speak = useCallback(async (text: string, messageId: string, retryAttempt = 0) => {
        if (!text.trim() || !aiRef.current || isVoiceDisabled) {
            addMessage(text, 'bot', messageId);
            setBotStatus('idle');
            return;
        }
        
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
                    responseModalities: [Modality.AUDIO],
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
            if (error instanceof ApiError && error.message.includes('RESOURCE_EXHAUSTED') && retryAttempt < API_KEYS.length) {
                console.warn(`Quota exceeded for key index ${apiKeyIndexRef.current}. Attempting to switch to the next key.`);
                apiKeyIndexRef.current++;
                if (apiKeyIndexRef.current < API_KEYS.length) {
                    if (initializeAI(apiKeyIndexRef.current)) {
                        // Retry the speak call with the new key
                        // Fix: Use window.setTimeout for consistency.
                        window.setTimeout(() => speak(text, messageId, retryAttempt + 1), 1000);
                        return; // Exit to avoid falling through to the general error case
                    }
                }
            }

            // If all keys are exhausted or it's not a quota error
            setIsVoiceDisabled(true);
            const errorText = "My voice needs a little rest right now, but I can still chat via text. Here's what I was going to say. 🙏";
            addMessage(errorText, 'bot', Date.now().toString() + '_err');
            addMessage(text, 'bot', messageId);
            setBotStatus('idle');
        }
    }, [addMessage, stopCurrentSpeech, isVoiceDisabled, initializeAI]);
    
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
        if (!hasAppeared) {
            if (messages.length > 0) {
                // If history exists, just show the assistant button.
                setHasAppeared(true);
                welcomeMessageSentRef.current = true; // Prevent welcome message.
            } else if (isReady && audioUnlocked && !welcomeMessageSentRef.current) {
                // If no history, and ready to go, send welcome message.
                // Fix: Use window.setTimeout for consistency.
                 window.setTimeout(() => {
                    setHasAppeared(true);
                    const hasVisited = localStorage.getItem('fuadAssistantVisited');
                    const welcomeMessages = hasVisited ? WELCOME_MESSAGES_RETURN : WELCOME_MESSAGES_FIRST_TIME;
                    const welcomeMessage = getRandomResponse(welcomeMessages, lastWelcomeRef);
                    localStorage.setItem('fuadAssistantVisited', 'true');
                    proactiveSpeakAndDisplay(welcomeMessage);
                    welcomeMessageSentRef.current = true;
                }, 500);
            }
        }
    }, [isReady, audioUnlocked, proactiveSpeakAndDisplay, messages.length, hasAppeared]);

    const [currentVisibleSection, setCurrentVisibleSection] = useState<string | null>(null);
    // Fix: Use ReturnType<typeof window.setTimeout> for timer IDs to ensure correct browser types and resolve type conflicts.
    const explanationTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
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
        // Fix: Use window.clearTimeout for consistency.
        if (explanationTimerRef.current) window.clearTimeout(explanationTimerRef.current);

        if (!currentVisibleSection || explainedSections.current.has(currentVisibleSection) || !hasAppeared || !isReady) return;

        const isSpeaking = botStatusRef.current === 'speaking' || botStatusRef.current === 'thinking';
        if (isSpeaking) {
            stopCurrentSpeech();
            proactiveSpeakAndDisplay(getRandomResponse(INTERRUPTION_RESPONSES, lastInterruptionRef));
        }

        // Fix: Use window.setTimeout for consistency.
        explanationTimerRef.current = window.setTimeout(() => {
            let text = '';
            const sectionKey = currentVisibleSection as keyof typeof SECTION_EXPLANATIONS;
            if (SECTION_EXPLANATIONS[sectionKey]) {
                const responses = SECTION_EXPLANATIONS[sectionKey];
                let availableResponses = responses;
                const lastUsed = lastSectionExplanationRef.current[sectionKey];
                if (lastUsed && responses.length > 1) {
                    availableResponses = responses.filter(r => r !== lastUsed);
                }
                const randomIndex = Math.floor(Math.random() * availableResponses.length);
                text = availableResponses[randomIndex];
                lastSectionExplanationRef.current[sectionKey] = text;
            }
            if (text) {
                proactiveSpeakAndDisplay(text);
                explainedSections.current.add(currentVisibleSection);
            }
        }, 1000);

        return () => {
            // Fix: Use window.clearTimeout for consistency.
            if (explanationTimerRef.current) window.clearTimeout(explanationTimerRef.current);
        };
    }, [currentVisibleSection, hasAppeared, isReady, stopCurrentSpeech, proactiveSpeakAndDisplay]);
    
    const lastMovementTrigger = useRef(0);
    useEffect(() => {
        if (onExcessiveMovement > lastMovementTrigger.current) {
            lastMovementTrigger.current = onExcessiveMovement;
            const funnyResponse = getRandomResponse(EXCESSIVE_MOVEMENT_RESPONSES, lastMovementRef);
            proactiveSpeakAndDisplay(funnyResponse);
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
            // Fix: Use window.clearTimeout and ensure timer ID ref has the correct type.
            if (inactivityMessageTimerRef.current) window.clearTimeout(inactivityMessageTimerRef.current);
            // Fix: Use window.clearTimeout and ensure timer ID ref has the correct type.
            if (closeChatTimerRef.current) window.clearTimeout(closeChatTimerRef.current);
            // Fix: Use window.setTimeout to avoid type conflicts with Node.js env.
            inactivityMessageTimerRef.current = window.setTimeout(handleInactivity, 30000); // 30 seconds for story
            // Fix: Use window.setTimeout to avoid type conflicts with Node.js env.
            closeChatTimerRef.current = window.setTimeout(() => {
                if (document.visibilityState === 'visible') setIsChatOpen(false);
            }, 90000);
        };
        if (isChatOpen) {
            const events: ('mousemove' | 'mousedown' | 'keydown' | 'touchstart' | 'input')[] = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'input'];
            resetTimers();
            events.forEach(event => window.addEventListener(event, resetTimers, { capture: true, passive: true }));
            return () => {
                // Fix: Use window.clearTimeout for consistency.
                if (inactivityMessageTimerRef.current) window.clearTimeout(inactivityMessageTimerRef.current);
                // Fix: Use window.clearTimeout for consistency.
                if (closeChatTimerRef.current) window.clearTimeout(closeChatTimerRef.current);
                events.forEach(event => window.removeEventListener(event, resetTimers, { capture: true }));
            };
        }
    }, [isChatOpen, handleInactivity]);

    if (!isReady && !hasAppeared) return null;

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
                    {(botStatus === 'speaking' && !isVoiceDisabled) && <div className="assistant-waveform" />}
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
                                    {(botStatus === 'speaking' && !isVoiceDisabled) && <div className="assistant-waveform" style={{ inset: '-6px', borderWidth: '1.5px' }} />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">Fuad Ahmed</h3>
                                    <p className={`text-xs flex items-center gap-1.5 ${isVoiceDisabled ? 'text-yellow-400' : 'text-green-400'}`}>
                                        <span className="relative flex h-2 w-2">
                                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isVoiceDisabled ? 'bg-yellow-400' : 'bg-green-400'}`}></span>
                                            <span className={`relative inline-flex rounded-full h-2 w-2 ${isVoiceDisabled ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                                        </span>
                                        {isVoiceDisabled ? "Voice is resting" : "Online"}
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
                                    disabled={!isReady}
                                />
                                <button type="submit" disabled={botStatus !== 'idle' || !userInput.trim() || !isReady} className="bg-red-600 text-white p-2.5 rounded-full disabled:bg-gray-600 disabled:cursor-not-allowed transition-all hover:bg-red-700 transform hover:scale-110">
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