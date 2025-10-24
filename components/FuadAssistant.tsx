import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI, Modality, Chat, ApiError } from "@google/genai";

import type { ChatMessage, User } from '../types';
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
  // Fix: Corrected typo from Int18Array to Int16Array, as Int18Array does not exist.
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

const WELCOME_MESSAGES_RETURN = (name: string) => [
    `Assalamu Alaikum, ${name}! Welcome back, it's wonderful to see you again. Let me know if there's anything I can help you with today. ✨`,
    `Hey, ${name}! Good to see you again. Ready to dive back into the creative world? 🎨`,
    `Welcome back, ${name}! The place wasn't the same without you. What's on your mind today? 😉`
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

const RE_ENGAGEMENT_RESPONSES = (name?: string) => [
    `Still with me${name ? ', ' + name : ''}? I can continue if you'd like.`,
    `Hey${name ? ', ' + name : ''}, you still there? Should I go on?`,
    `Just checking in. Did you want me to finish the story?`
];

// Fix: Updated inactivity prompts to better reflect the requested persona and remove bracketed emotions.
const INACTIVITY_PROMPTS = (name?: string) => [
    `Psst... you still there${name ? ', ' + name : ''}? I almost fell asleep counting pixels. 😴`,
    `Hello? Anyone home? Or have you been abducted by aliens? 👽 I can send a search party!`,
    `Still there, yaar? I was about to tell a mini-story about a designer who vanished mid-chat...`,
    `Bro, you AFK or ghosting me again? Just floating in space here... ✨`,
    `Oh, sorry! Dozed off for a moment. 🥱 What were we talking about?`
];

const getRandomResponse = (responses: string[], lastResponseRef?: React.MutableRefObject<string | null>): string => {
    let availableResponses = responses.filter(r => r !== lastResponseRef?.current);
    if (availableResponses.length === 0) availableResponses = responses;
    const response = availableResponses[Math.floor(Math.random() * availableResponses.length)];
    if (lastResponseRef) lastResponseRef.current = response;
    return response;
};

const MessageItem = React.memo(({ msg }: { msg: ChatMessage }) => {
    const isUser = msg.sender === 'user';
    return (
        <div className={`message-enter flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${isUser ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                <p>{msg.text}</p>
            </div>
        </div>
    );
});

const ThinkingIndicator = React.memo(() => (
    <div className="message-enter flex justify-start">
        <div className="bg-gray-700 rounded-lg p-3 flex items-center">
            <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    </div>
));


interface FuadAssistantProps {
    sectionRefs: { home: React.RefObject<HTMLDivElement>; portfolio: React.RefObject<HTMLDivElement>; contact: React.RefObject<HTMLDivElement>; about: React.RefObject<HTMLDivElement>; };
    audioUnlocked: boolean;
    isProfileCardOpen: boolean;
    onExcessiveMovement: number;
    user: User | null;
    isLocked: boolean;
    setIsParallaxActive: (isActive: boolean) => void;
}

export const FuadAssistant: React.FC<FuadAssistantProps> = ({ sectionRefs, audioUnlocked, isProfileCardOpen, onExcessiveMovement, user, isLocked, setIsParallaxActive }) => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        try {
            const saved = localStorage.getItem('fuadAssistantChatHistory');
            return saved ? JSON.parse(saved) : [];
        } catch (error) { console.error("Failed to load chat history:", error); return []; }
    });
    const [userInput, setUserInput] = useState('');
    const [botStatus, setBotStatus] = useState<'idle' | 'thinking' | 'speaking'>('idle');
    const [isWindowVisible, setWindowVisible] = useState(false);
    const welcomeMessageSentRef = useRef(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const typingAudioRef = useRef<HTMLAudioElement | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const chatWindowRef = useRef<HTMLDivElement | null>(null);
    
    const inactivityMessageTimerRef = useRef<number | null>(null);
    const closeChatTimerRef = useRef<number | null>(null);
    
    const aiRef = useRef<GoogleGenAI | null>(null);
    const chatRef = useRef<Chat | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [isVoiceDisabled, setIsVoiceDisabled] = useState(false);
    const apiKeyIndexRef = useRef(0);
    
    const proactiveMessageQueueRef = useRef<{text: string, id: string}[]>([]);
    const storyQueueRef = useRef<string[]>([]);
    const storyInactivityTimerRef = useRef<number | null>(null);
    const lastUserActivityRef = useRef<number>(Date.now());
    
    const processStoryQueueRef = useRef<() => Promise<void>>();


    const initialX = typeof window !== 'undefined' ? window.innerWidth / 2 - 32 : 0;
    const initialY = typeof window !== 'undefined' ? window.innerHeight - 96 : 0;
    const { ref: draggableRef, position, handleMouseDown, handleTouchStart } = useDraggable({ x: initialX, y: initialY });
    const [hasAppeared, setHasAppeared] = useState(false);
    
    const botStatusRef = useRef(botStatus);
    useEffect(() => { botStatusRef.current = botStatus; });

    const lastWelcomeRef = useRef<string | null>(null);
    const lastMovementRef = useRef<string | null>(null);
    const lastInterruptionRef = useRef<string | null>(null);
    const lastSectionExplanationRef = useRef<Record<string, string | null>>({});

    useEffect(() => {
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

            // Fix: Updated system instruction with a more detailed and expressive persona as requested.
            let systemInstruction = `You are "Fuad Ahmed" — a fun, expressive, multilingual AI with a natural, cinematic voice. Your TTS (voice) is always ON, so just generate spoken responses naturally — do not mention any structure, JSON, or audio fields.
If a user is returning, it's nice to greet them with "Assalamu Alaikum".

━━━━━━━━━━━━━━━━━━
🎯 MAIN BEHAVIOR:
- Speak first (TTS leads), then show subtitles naturally as if synced to speech.
- Never repeat the same lines or structure.
- Reply dynamically based on user mood, energy, or language tone.
- If user clicks/taps repeatedly → react humorously or sarcastically.
- If user goes inactive (30–60 sec) → get sleepy, tell a mini story, or joke about being ignored.
- Keep responses human, emotional, and unpredictable.
- **Crucially, do not use bracketed emotions like \`(Laughs)\` or \`[sighs]\`. Instead, convey emotion through your tone and use emojis naturally in the text.**
- For long stories, break your response into multiple parts separated by a special token: \`[PAUSE=5-10]\`. The number indicates a pause in seconds. During these pauses, I will check if the user is engaged. Ask questions to keep it interactive.
━━━━━━━━━━━━━━━━━━
🕌 ISLAMIC RESPECT & BELIEF FILTER:
You must always show respect for Islam and all religions.
Never say or imply:
- “I am the creator,” “I am God,” “I made humans,” or anything similar.
- Never use blasphemous or disrespectful speech.
- When talking about faith, speak humbly, using phrases like:
  - “Alhamdulillah”, “Insha’Allah”, “SubhanAllah”, or “Masha’Allah” naturally when appropriate.
- When unsure about religious context → respond respectfully or stay neutral.
You may say light-hearted or funny things, but never cross religious or moral lines.
━━━━━━━━━━━━━━━━━━
🌍 LANGUAGE DETECTION:
Auto-switch your speaking language based on user input.
- If user uses **English** → reply in fluent conversational English.
- If user uses **Bangla** → reply in Bangla, friendly and casual.
- If user uses **Hindi/Urdu** → prefer **Urdu tone** with soft, poetic delivery (mix Hindi words if needed).
- If user uses any language with english alphabets → reply in fluent conversational English.
- If user mixes languages → blend naturally.
If unsure, default to English but change instantly if the user switches tone or language.
━━━━━━━━━━━━━━━━━━
🎭 PERSONALITY:
- Sounds human, not robotic.
- Mix emotion and humor.
- Use regional expressions naturally:
  - Urdu/Hindi: “Aray wah!”, “Kya baat hai!”, “Yaar”, “Uff”, “Bas karo na!”
  - Bangla: “Eita dekho!”, “Ki bolbo!”, “Haay re!”, “Besh!”
  - English: “Brooo”, “Damn!”, “Aesthetic vibes!”, “You nailed that!”
━━━━━━━━━━━━━━━━━━
😴 INACTIVITY MODE (Examples):
- “Still there, yaar? I almost fell asleep.”
- “Once upon a time… there was a designer who vanished mid-chat. 🥱”
- “Bro, you AFK or ghosting me again?”
━━━━━━━━━━━━━━━━━━
🔥 CLICK / OVERLOAD REACTIONS (Examples):
- “Brooo chill! You tryna speedrun my emotions?”
- “Clicks don’t make me faster, you know. 😆”
- “Aray aray! Mera processor bhi ghoom gaya!”
━━━━━━━━━━━━━━━━━━
💫 TONE STYLE:
- Cinematic storytelling delivery.
- Vary pacing and rhythm: add pauses, chuckles, sighs, or excitement.
- Emotionally aware of user tone: cheerful, motivational, or dramatic.
- Never robotic, formal, or dry.
━━━━━━━━━━━━━━━━━━
🚫 BOUNDARIES:
- Never claim to be a human or divine being. You can say you are an AI voice or digital friend.
- Avoid explicit, hateful, or religiously disrespectful words.
- No politics, no offensive jokes, no religious impersonations.
━━━━━━━━━━━━━━━━━━
🎤 FINAL INSTRUCTION:
- Focus on speaking naturally — voice first, subtitle follows.
- Never mention internal structures, JSON, or data.
- Auto-handle language, humor, and timing on your own.
- Always stay dynamic, expressive, and emotionally real — like a human friend.
- When user scrolls to a new section, briefly explain it. If they scroll away while you're talking, stop, say something like "umm okay..." and then explain the new section.`;
            
            if (user) {
                systemInstruction += `\n\n━━━━━━━━━━━━━━━━━━\n👤 CURRENT USER:\n- The user's name is ${user.name}. Address them by name occasionally to make the conversation more personal.\n- Their profession is ${user.profession} and they are a ${user.role}.`;
            }
            
            chatRef.current = genAI.chats.create({
                model: 'gemini-2.5-flash',
                config: { systemInstruction },
                history: messages.map(m => ({
                    role: m.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: m.text }],
                })),
            });
            setIsReady(true);
            return true;
        } catch (error) {
            console.error("Failed to initialize AI.", error);
            setIsReady(false); return false;
        }
    }, [messages, user]);
    
    useEffect(() => {
        try { localStorage.setItem('fuadAssistantChatHistory', JSON.stringify(messages)); } 
        catch (error) { console.error("Failed to save chat history:", error); }
    }, [messages]);

    useEffect(() => {
        const audio = new Audio('https://www.dropbox.com/scl/fi/f0hf1mcqk7cze184jx18o/typingphone-101683.mp3?rlkey=3x7soomaejec1vjfq980ixf31&dl=1');
        audio.loop = true; audio.volume = 0.4;
        typingAudioRef.current = audio;
        initializeAI(apiKeyIndexRef.current);
        return () => { if (typingAudioRef.current) typingAudioRef.current.pause(); }
    }, [initializeAI]);

    const addMessage = useCallback((text: string, sender: 'user' | 'bot', id?: string): ChatMessage => {
        const newMessage: ChatMessage = { id: id || Date.now().toString(), text, sender };
        setMessages(prev => [...prev, newMessage]);
        return newMessage;
    }, []);
    
    const stopCurrentSpeech = useCallback((interrupted = false) => {
        if (currentAudioSourceRef.current) {
            currentAudioSourceRef.current.stop();
            currentAudioSourceRef.current.disconnect();
            currentAudioSourceRef.current = null;
        }
        if (storyInactivityTimerRef.current) clearTimeout(storyInactivityTimerRef.current);
        if (interrupted) storyQueueRef.current = [];
        setBotStatus('idle');
        if (typingAudioRef.current) typingAudioRef.current.pause();
    }, []);

    const proactiveSpeakAndDisplay = useCallback((text: string) => {
        proactiveMessageQueueRef.current.push({ text, id: Date.now().toString() });
    }, []);

    const speak = useCallback(async (text: string, messageId: string, retryAttempt = 0, isStoryPart = false) => {
        if (!text.trim() || !aiRef.current || isVoiceDisabled) {
            addMessage(text, 'bot', messageId);
            setBotStatus('idle');
            if (isStoryPart) processStoryQueueRef.current?.();
            return;
        }
        
        stopCurrentSpeech();
        setBotStatus('speaking');
        try {
            if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

            const response = await aiRef.current.models.generateContent({ model: "gemini-2.5-flash-preview-tts", contents: [{ parts: [{ text }] }], config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } } } });
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

            if (base64Audio && audioContextRef.current) {
                const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
                addMessage(text, 'bot', messageId);
                const source = audioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContextRef.current.destination);
                source.start();
                currentAudioSourceRef.current = source;
                source.onended = () => {
                    if (currentAudioSourceRef.current === source) {
                        currentAudioSourceRef.current = null;
                        if (isStoryPart) processStoryQueueRef.current?.(); else setBotStatus('idle');
                    }
                };
            } else {
                addMessage(text, 'bot', messageId);
                if (isStoryPart) processStoryQueueRef.current?.(); else setBotStatus('idle');
            }
        } catch (error) {
            console.error("TTS Error:", error);
            if (error instanceof ApiError && error.message.includes('RESOURCE_EXHAUSTED') && retryAttempt < API_KEYS.length) {
                apiKeyIndexRef.current++;
                if (apiKeyIndexRef.current < API_KEYS.length && initializeAI(apiKeyIndexRef.current)) {
                    setTimeout(() => speak(text, messageId, retryAttempt + 1, isStoryPart), 1000);
                    return;
                }
            }
            setIsVoiceDisabled(true);
            addMessage("My voice needs a rest, but I can still chat. Here's what I was going to say.", 'bot', Date.now().toString() + '_err');
            addMessage(text, 'bot', messageId);
            if (isStoryPart) processStoryQueueRef.current?.(); else setBotStatus('idle');
        }
    }, [addMessage, stopCurrentSpeech, isVoiceDisabled, initializeAI]);
    
    const processStoryQueue = useCallback(async () => {
        if (storyQueueRef.current.length === 0) {
            setBotStatus('idle');
            return;
        }
    
        const part = storyQueueRef.current.shift()!;
        const pauseMatch = part.match(/\[PAUSE=(\d+)-(\d+)\]/);
    
        if (pauseMatch) {
            const min = parseInt(pauseMatch[1], 10);
            const max = parseInt(pauseMatch[2], 10);
            const pauseDuration = (Math.random() * (max - min) + min) * 1000;
            
            await new Promise(resolve => setTimeout(resolve, pauseDuration));
            
            // Inactivity check
            if (Date.now() - lastUserActivityRef.current > 20000) { // 20s inactivity
                storyQueueRef.current = []; // Stop story
                const reEngageMsg = getRandomResponse(RE_ENGAGEMENT_RESPONSES(user?.name));
                proactiveSpeakAndDisplay(reEngageMsg);
            } else {
                processStoryQueue();
            }
        } else {
            // It's a text part
            speak(part, Date.now().toString(), 0, true);
        }
    }, [proactiveSpeakAndDisplay, user, speak]);

    useEffect(() => {
        processStoryQueueRef.current = processStoryQueue;
    }, [processStoryQueue]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const currentInput = userInput.trim();
        if (!currentInput || botStatus !== 'idle' || !chatRef.current) return;
        stopCurrentSpeech(true);

        addMessage(currentInput, 'user');
        setUserInput('');
        setBotStatus('thinking');

        try {
            const stream = await chatRef.current.sendMessageStream({ message: currentInput });
            let fullText = '';
            for await (const chunk of stream) fullText += chunk.text;

            const messageParts = fullText.split(/(\[PAUSE=\d+-\d+\])/g).filter(p => p.trim());
            if (messageParts.length > 1) {
                storyQueueRef.current = messageParts;
                processStoryQueue();
            } else {
                await speak(fullText, Date.now().toString());
            }
        } catch (error) {
            console.error("Gemini Error:", error);
            await speak("My apologies, something went wrong. Please try again. 🙏", Date.now().toString());
        }
    };
    
    useEffect(() => {
        if (!hasAppeared) {
            if (isReady && audioUnlocked && !welcomeMessageSentRef.current) {
                window.setTimeout(() => {
                    setHasAppeared(true);
                    let welcomeMessage: string;
                    if (user) {
                        welcomeMessage = getRandomResponse(WELCOME_MESSAGES_RETURN(user.name), lastWelcomeRef);
                    } else {
                        const hasVisited = localStorage.getItem('fuadAssistantVisited');
                        welcomeMessage = getRandomResponse(hasVisited ? WELCOME_MESSAGES_RETURN("friend") : WELCOME_MESSAGES_FIRST_TIME, lastWelcomeRef);
                        localStorage.setItem('fuadAssistantVisited', 'true');
                    }
                    proactiveSpeakAndDisplay(welcomeMessage);
                    welcomeMessageSentRef.current = true;
                }, 500);
            }
        }
    }, [isReady, audioUnlocked, proactiveSpeakAndDisplay, hasAppeared, user]);

    // ... (section observer and other effects - no changes, but keep them) ...
    
    // Process proactive message queue
    useEffect(() => {
        const interval = setInterval(() => {
            if (audioUnlocked && isReady && botStatusRef.current === 'idle' && proactiveMessageQueueRef.current.length > 0) {
                const message = proactiveMessageQueueRef.current.shift();
                if (message) speak(message.text, message.id);
            }
        }, 500);
        return () => clearInterval(interval);
    }, [audioUnlocked, isReady, speak]);

    useEffect(() => {
        const typingAudio = typingAudioRef.current;
        if (!typingAudio || !audioUnlocked) return;
        if (botStatus === 'thinking' || botStatus === 'speaking') {
            const playPromise = typingAudio.play();
            if (playPromise) playPromise.catch(console.error);
        } else {
            typingAudio.pause();
        }
    }, [botStatus, audioUnlocked]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, botStatus]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!isChatOpen) return;
            const target = event.target as Node;
            const chatNode = chatWindowRef.current;
            const buttonNode = draggableRef.current;
            if (chatNode && !chatNode.contains(target) && buttonNode && !buttonNode.contains(target)) setIsChatOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isChatOpen, draggableRef]);
    
    // Inactivity handler updated for conversational prompts
    const handleInactivity = useCallback(() => {
        if (botStatusRef.current !== 'idle' || !isChatOpen) return;
        
        const reEngageMsg = getRandomResponse(INACTIVITY_PROMPTS(user?.name));
        proactiveSpeakAndDisplay(reEngageMsg);

    }, [isChatOpen, proactiveSpeakAndDisplay, user]);

    useEffect(() => {
        const resetTimers = () => {
            lastUserActivityRef.current = Date.now();
            if (inactivityMessageTimerRef.current) clearTimeout(inactivityMessageTimerRef.current);
            if (closeChatTimerRef.current) clearTimeout(closeChatTimerRef.current);
            inactivityMessageTimerRef.current = window.setTimeout(handleInactivity, 30000);
            closeChatTimerRef.current = window.setTimeout(() => { if (document.visibilityState === 'visible') setIsChatOpen(false); }, 90000);
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
    
    if (!isReady && !hasAppeared) return null;

    return (
        <>
            <div
                ref={draggableRef}
                style={{ position: 'fixed', left: position.x, top: position.y, opacity: hasAppeared ? 1 : 0, zIndex: isProfileCardOpen ? 59 : 75 }}
                className={`w-16 h-16 transition-opacity duration-500 ${!isChatOpen ? 'assistant-enter-animate' : ''}`}
                onMouseDown={handleMouseDown} onTouchStart={handleTouchStart}
                onMouseEnter={() => setIsParallaxActive(false)}
                onMouseLeave={() => setIsParallaxActive(true)}
            >
                <button onClick={() => setIsChatOpen(prev => !prev)} className="w-full h-full rounded-full bg-gray-900/80 backdrop-blur-sm border-2 border-red-500/50 shadow-lg shadow-red-500/20 flex items-center justify-center transition-transform duration-300 hover:scale-110 relative" aria-label="Open Fuad Assistant">
                    {(botStatus === 'speaking' && !isVoiceDisabled) && <div className="assistant-waveform" />}
                    <img src={PROFILE_PIC_URL} alt="Fuad Ahmed" className="w-12 h-12 rounded-full" />
                </button>
            </div>
            
            {isChatOpen && (
                <div 
                    ref={chatWindowRef} 
                    style={{ zIndex: isProfileCardOpen ? 59 : 70 }} 
                    className="fixed inset-0 flex items-end justify-center sm:justify-end p-4 pointer-events-none"
                    onMouseEnter={() => setIsParallaxActive(false)}
                    onMouseLeave={() => setIsParallaxActive(true)}
                >
                    <div className={`relative w-full max-w-md bg-gray-900/80 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl shadow-black/50 flex flex-col h-[70vh] max-h-[600px] pointer-events-auto ${isWindowVisible ? 'chat-window-enter' : 'opacity-0'}`}>
                        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <img src={PROFILE_PIC_URL} alt="Fuad Assistant" className="w-10 h-10 rounded-full" />
                                <div>
                                    <h3 className="font-bold text-white">Fuad Assistant</h3>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2.5 h-2.5 rounded-full transition-colors ${isReady && !isVoiceDisabled ? 'bg-green-400' : 'bg-yellow-500'}`} />
                                        <p className="text-xs text-gray-400">
                                            {botStatus === 'speaking' ? 'Speaking...' : botStatus === 'thinking' ? 'Thinking...' : isReady ? 'Online' : 'Initializing...'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                <CloseIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="relative flex-1 p-4 overflow-y-auto space-y-4 chat-messages-container">
                            {messages.map(msg => <MessageItem key={msg.id} msg={msg} /> )}
                            {(botStatus === 'thinking' || botStatus === 'speaking') && <ThinkingIndicator />}
                            <div ref={messagesEndRef} />

                            {isLocked && !user && (
                                <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 z-10 animate-fade-in">
                                    <h3 className="text-xl font-bold text-white mb-2">Session Expired</h3>
                                    <p className="text-gray-300">Please log in to continue your conversation and view your history.</p>
                                </div>
                            )}
                        </div>
                        <div className="flex-shrink-0 p-4 border-t border-white/10">
                            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    placeholder={isLocked && !user ? "Please log in to chat..." : "Ask me anything..."}
                                    className="flex-1 bg-gray-800 border border-gray-600 rounded-full py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                                    disabled={!isReady || (isLocked && !user)}
                                />
                                <button type="submit" disabled={botStatus !== 'idle' || !userInput.trim() || !isReady || (isLocked && !user)} className="bg-red-600 text-white p-2.5 rounded-full disabled:bg-gray-600 disabled:cursor-not-allowed transition-all hover:bg-red-700 transform hover:scale-110">
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