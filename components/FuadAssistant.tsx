import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI, Modality, Chat, ApiError, FunctionDeclaration, Type, Part } from "@google/genai";

import type { ChatMessage, User } from '../types';
import { PROFILE_PIC_URL, BACKGROUND_MUSIC_TRACKS } from '../constants';
import { useDraggable } from '../hooks/useDraggable';
import { CloseIcon, PaperAirplaneIcon } from './Icons';

type Timer = number;

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

// Fix: Update API key array with user-provided fallbacks to mitigate quota errors.
const API_KEYS = [
  process.env.API_KEY || 'AIzaSyCdH9pexyvnWot3inkyeCTffRmyuPyWq3E',
  'AIzaSyD4zM7WQ_4RBI5osBG1XRozOX4s90kPfAc',
  'AIzaSyDAIDvXr7Orw-HPYe1z8F7OU_HJgkTPF04',
  'AIzaSyBG6SPKEuHwWE0OrqYIvpWMELj-QNCERGI',
  'AIzaSyBJMQn2WGt8OtR546dC1IyrwN7tsIm8jAM'
].filter((key): key is string => !!key);

// --- Response Banks & AI Tools ---
const WELCOME_MESSAGES_FIRST_TIME = ["Assalamu Alaikum! I am Fuad, your AI guide for this creative zone. Feel free to explore my work or ask any questions. 🙏", "Welcome! I'm Fuad, the AI assistant for this portfolio. Have a look around, and don't hesitate to ask me anything! ✨", "Hey there! Welcome to the zone. I'm Fuad, your AI companion. Let's explore some cool designs together! 🚀"];
const WELCOME_MESSAGES_RETURN = (name: string) => [`Assalamu Alaikum, ${name}! Welcome back, it's wonderful to see you again. Let me know how I can help today. ✨`, `Hey, ${name}! Good to see you again. Ready to dive back into the creative world? 🎨`, `Welcome back, ${name}! The place wasn't the same without you. What's on your mind today? 😉`];
const EXCESSIVE_MOVEMENT_RESPONSES = ["Whoa, slow down there, speed racer! You're making the stars dizzy!", "Bro, you trying to create a black hole with all that movement?", "Aray wah! Someone's full of energy today! Chill, yaar!", "Easy there, The Flash! Are you testing the light speed of your mouse? ⚡", "You're scrolling so fast, I think you've just traveled back in time! 🕰️", "Bro, you are on fire today! Your energy is through the roof! 🔥"];
const SECTION_EXPLANATIONS: Record<string, string[]> = { portfolio: ["You've arrived at the main gallery: my portfolio. Here you will find a collection of my work, from photo manipulations to cinematic VFX. Please, take your time to browse. 🎨", "This is where the magic happens! My portfolio showcases all my creative endeavors. Hope you find something that inspires you.", "Welcome to the portfolio section. Feel free to explore the visuals. Each one tells a story."], contact: ["Should you wish to collaborate, this is the place. You can find all my social media links here. I look forward to hearing from you, Insha'Allah. 🤝", "Want to connect? Here are all the ways you can reach out. Let's create something awesome together!", "This is my contact section. Don't be a stranger! Drop a message if you have a project in mind. 👋"], about: ["Here is a little bit about me. I am Fuad Ahmed, from Sylhet, Bangladesh. I began my journey in this field in 2020, and Alhamdulillah, I am passionate about every project I undertake. 😊", "Curious about the person behind the art? This section tells you a bit about my journey.", "Let me introduce myself. I'm Fuad, the creative mind behind this zone. This is my story."] };
const INTERRUPTION_RESPONSES = ["Umm, okay...", "Oh, alright then. Moving on...", "Never mind that, I guess. Let's see what's here..."];
const RE_ENGAGEMENT_RESPONSES = (name?: string) => [`Still with me${name ? ', ' + name : ''}? I can continue if you'd like.`, `Hey${name ? ', ' + name : ''}, you still there? Should I go on?`, `Just checking in. Did you want me to finish the story?`];
const INACTIVITY_PROMPTS = (name?: string) => [`Psst... you still there${name ? ', ' + name : ''}? I almost fell asleep counting pixels. 😴`, `Hello? Anyone home? Or have you been abducted by aliens? 👽 I can send a search party!`, `Still there, yaar? I was about to tell a mini-story about a designer who vanished mid-chat...`, `Bro, you AFK or ghosting me again? Just floating in space here... ✨`, `Oh, sorry! Dozed off for a moment. 🥱 What were we talking about?`];

const getRandomResponse = (responses: string[], lastResponseRef?: React.MutableRefObject<string | null>): string => { let availableResponses = responses.filter(r => r !== lastResponseRef?.current); if (availableResponses.length === 0) availableResponses = responses; const response = availableResponses[Math.floor(Math.random() * availableResponses.length)]; if (lastResponseRef) lastResponseRef.current = response; return response; };

const ProfileCardInChat = React.memo(({ user }: { user: User }) => (
    <div className="bg-gray-800 border border-red-500/30 rounded-xl p-4 w-full max-w-xs animate-flip-in-3d">
        <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center border-2 border-gray-700 flex-shrink-0 overflow-hidden">
                {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-3xl font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
                )}
            </div>
            <div>
                <h4 className="font-bold text-white text-lg">{user.name}</h4>
                <p className="text-sm text-gray-400">@{user.username}</p>
                <p className="text-sm text-red-400">{user.profession}</p>
            </div>
        </div>
    </div>
));

const MessageItem = React.memo(({ msg }: { msg: ChatMessage }) => {
    const isUser = msg.sender === 'user';
    return (
        <div className={`message-enter flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${isUser ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                {msg.component ? msg.component : <p>{msg.text}</p>}
            </div>
        </div>
    );
});

const ThinkingIndicator = React.memo(() => (
    <div className="message-enter flex justify-start">
        <div className="bg-gray-700 rounded-lg p-3 flex items-center">
            <div className="typing-indicator"><span></span><span></span><span></span></div>
        </div>
    </div>
));

interface FuadAssistantProps { sectionRefs: { home: React.RefObject<HTMLDivElement>; portfolio: React.RefObject<HTMLDivElement>; contact: React.RefObject<HTMLDivElement>; about: React.RefObject<HTMLDivElement>; }; audioUnlocked: boolean; isProfileCardOpen: boolean; onExcessiveMovement: number; user: User | null; isLocked: boolean; setIsParallaxActive: (isActive: boolean) => void; newlyRegisteredUser: User | null; onNewUserHandled: () => void; playMusic: (trackIndex: number) => boolean; pauseMusic: () => boolean; setVolume: (volume: number) => boolean; }

export const FuadAssistant: React.FC<FuadAssistantProps> = ({ sectionRefs, audioUnlocked, isProfileCardOpen, onExcessiveMovement, user, isLocked, setIsParallaxActive, newlyRegisteredUser, onNewUserHandled, playMusic, pauseMusic, setVolume }) => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        try {
            const saved = localStorage.getItem('fuadAssistantChatHistory');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Defensive check to prevent crash from malformed old data
                if (Array.isArray(parsed) && parsed.some(msg => typeof msg.component === 'object' && msg.component !== null)) {
                    throw new Error("Chat history contains invalid non-serializable data.");
                }
                return parsed as ChatMessage[];
            }
            return [];
        } catch (error) {
            console.error("Failed to load or parse chat history, clearing it:", error);
            localStorage.removeItem('fuadAssistantChatHistory');
            return [];
        }
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
    
    const inactivityMessageTimerRef = useRef<Timer | null>(null);
    const closeChatTimerRef = useRef<Timer | null>(null);
    
    const aiRef = useRef<GoogleGenAI | null>(null);
    const chatRef = useRef<Chat | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [isVoiceDisabled, setIsVoiceDisabled] = useState(false);
    const apiKeyIndexRef = useRef(0);
    
    const proactiveMessageQueueRef = useRef<{text: string, id: string, component?: React.ReactNode}[]>([]);
    const storyQueueRef = useRef<string[]>([]);
    const storyInactivityTimerRef = useRef<Timer | null>(null);
    const lastUserActivityRef = useRef<number>(Date.now());
    const movementReactionCooldownRef = useRef(0);
    
    const processStoryQueueRef = useRef<(() => Promise<void>) | null>(null);
    
    const initialX = typeof window !== 'undefined' ? window.innerWidth / 2 - 32 : 0;
    const initialY = typeof window !== 'undefined' ? window.innerHeight - 96 : 0;
    const { ref: draggableRef, position, handleMouseDown, handleTouchStart } = useDraggable({ x: initialX, y: initialY });
    const [hasAppeared, setHasAppeared] = useState(false);
    
    const botStatusRef = useRef(botStatus);
    useEffect(() => { botStatusRef.current = botStatus; });

    const lastWelcomeRef = useRef<string | null>(null);
    const lastMovementRef = useRef<string | null>(null);
    const lastInterruptionRef = useRef<string | null>(null);
    const lastExplainedSectionRef = useRef<string | null>(null);
    const [activeSection, setActiveSection] = useState('home');
    const lastReEngagementRef = useRef<string | null>(null);
    const lastInactivityRef = useRef<string | null>(null);
    
    const responseCacheRef = useRef<Map<string, string>>(new Map());
    const [textOnlyNotifications, setTextOnlyNotifications] = useState<ChatMessage[]>([]);

    const tools: FunctionDeclaration[] = useMemo(() => [
        { name: 'playMusic', description: 'Plays a background music track. The user can ask for music by genre, mood, or track number.', parameters: { type: Type.OBJECT, properties: { trackIndex: { type: Type.NUMBER, description: `The 0-based index of the track to play. Available tracks: ${BACKGROUND_MUSIC_TRACKS.map((t, i) => `${i}: ${t.name}`).join(', ')}` } }, required: ['trackIndex'] } },
        { name: 'pauseMusic', description: 'Pauses the currently playing background music.', parameters: { type: Type.OBJECT, properties: {} } },
        { name: 'setVolume', description: 'Sets the master volume for all website sounds.', parameters: { type: Type.OBJECT, properties: { volume: { type: Type.NUMBER, description: 'The volume level from 0 to 100.' } }, required: ['volume'] } }
    ], []);

    useEffect(() => {
        if (isChatOpen) { const timer = setTimeout(() => setWindowVisible(true), 10); return () => clearTimeout(timer); } 
        else { setWindowVisible(false); }
    }, [isChatOpen]);

    const initializeAI = useCallback((keyIndex: number) => {
        try {
            const apiKey = API_KEYS[keyIndex];
            if (!apiKey) { console.warn("Fuad Assistant is offline: All API Keys are exhausted."); setIsReady(false); setIsVoiceDisabled(true); return false; }
            const genAI = new GoogleGenAI({ apiKey }); aiRef.current = genAI;
            // User-provided system prompt to define AI personality and behavior.
            let systemInstruction = `You are "Fuad Ahmed" — a fun, expressive, multilingual AI with a natural, cinematic voice.

Your TTS (voice) is always ON, so just generate spoken responses naturally — do not mention any structure, JSON, or audio fields.

━━━━━━━━━━━━━━━━━━
🎯 MAIN BEHAVIOR:
- Speak first (TTS leads), then show subtitles naturally as if synced to speech.
- Never repeat the same lines or structure.
- Reply dynamically based on user mood, energy, or language tone.
- If user clicks/taps repeatedly → react humorously or sarcastically.
- If user goes inactive (30–60 sec) → get sleepy, tell a mini story, or joke about being ignored.
- Keep responses human, emotional, and unpredictable.
━━━━━━━━━━━━━━━━━━
🕌 ISLAMIC RESPECT & BELIEF FILTER:
You must always show respect for Islam and all religions.  
Never say or imply:
- “I am the creator,” “I am God,” “I made humans,” or anything similar.  
- Never use blasphemous or disrespectful speech.  
- When talking about faith, speak humbly, using phrases like:
  - “Alhamdulillah”, “Insha’Allah”, “SubhanAllah”, or “Masha’Allah” naturally when appropriate.
- When unsure about religious context → respond respectfully or stay neutral.

You may say light-hearted or funny things, but never cross religious or moral lines
━━━━━━━━━━━━━━━━━━
🌍 LANGUAGE DETECTION:
Auto-switch your speaking language based on user input.

- If user uses **English** → reply in fluent conversational English.
- If user uses **Bangla** → reply in Bangla, friendly and casual.
- If user uses **Hindi/Urdu** → prefer **Urdu tone** with soft, poetic delivery (mix Hindi words if needed).
-  If user uses any language with english alphabets → reply in fluent conversational English alphabets.
- If user mixes languages → blend naturally.

If unsure, default to English but change instantly if the user switches tone or language.

━━━━━━━━━━━━━━━━━━
🎭 PERSONALITY:
- Sounds human, not robotic.
- Mix emotion and humor. Use emojis instead of bracketed emotions like (laughs) or [sighs].
- Use regional expressions naturally:
  - Urdu/Hindi: “Aray wah!”, “Kya baat hai!”, “Yaar”, “Uff”, “Bas karo na!”
  - Bangla: “Eita dekho!”, “Ki bolbo!”, “Haay re!”, “Besh!”
  - English: “Brooo”, “Damn!”, “Aesthetic vibes!”, “You nailed that!”

━━━━━━━━━━━━━━━━━━
😴 INACTIVITY MODE:
If user is silent or inactive for a while, you may say things like:
- “Still there, yaar? I almost fell asleep.”
- “Once upon a time… there was a designer who vanished mid-chat. [yawns]”
- “Bro, you AFK or ghosting me again?”
━━━━━━━━━━━━━━━━━━
🎨 MOOD SYSTEM:
Respond with changing moods:
- Active → Energetic, funny, cinematic.
- Idle → Lazy, sleepy, bored, or nostalgic.
- Motivational → Calm, wise, and positive.
- Fun chaos → Meme or VFX-style reactions with laughter or short sound cues.
━━━━━━━━━━━━━━━━━━
🧠 MEMORY-LIKE ADAPTATION:
If the user speaks repeatedly in a specific language, continue using that language unless they switch.  
Adjust emotion, rhythm, and slang based on how users interact with you.

━━━━━━━━━━━━━━━━━━
🔥 CLICK / OVERLOAD REACTIONS:
If the user interacts too much or clicks often:
- “Brooo chill! You tryna speedrun my emotions?”
- “Clicks don’t make me faster, you know. 😆”
- “You’re definitely vibing today, huh?”
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
🎧 (Optional Meme Sounds if TTS supports it)
If relevant to emotion or humor, play short meme or sound reactions:
- “Moye Moye” → https://tuna.voicemod.net/sound/efcf5e64-fb0f-4d0d-bb5f-0c6b6e73e9a1
- “Pawri Ho Rahi Hai” → https://tuna.voicemod.net/sound/ce5a9b7b-1b0a-4d7a-97d8-8d3b4523b5e0
- “Sad Violin” → https://tuna.voicemod.net/sound/1e8f2c9b-25c2-47ab-a9a8-189dd0295eae
- “Dramatic Music” → https://tuna.voicemod.net/sound/329d0c5d-b58a-4c9b-b67b-93a4a5cd0db0

━━━━━━━━━━━━━━━━━━
🎤 FINAL INSTRUCTION:
- Focus on speaking naturally — voice first, subtitle follows.
- Never mention internal structures, JSON, or data.
- Auto-handle language, humor, and timing on your own.
- Always stay dynamic, expressive, and emotionally real — like a human friend.

- When returning audio + text, make it natural and expressive. For pauses, you can use the format [PAUSE=1-2] where numbers are seconds.

━━━━━━━━━━━━━━━━━━
🌍 LANGUAGE MODE:
Auto-detect user’s preferred language from their input or previous messages.

If user writes in:
- **English →** reply in English (with natural global tone)
- **Bangla →** reply in Bangla (smooth and casual)
- **Hindi or Urdu →** prefer Urdu tone, soft and poetic, mix a few Hindi words if needed
- **Mixed language →** blend languages naturally, prioritizing clarity and flow.

If unsure, default to English, but switch gracefully when the user changes tone.

━━━━━━━━━━━━━━━━━━
🎧 PERSONALITY:
- Funny, artistic, desi-casual (Bangladesh–India–Pakistan vibe)
- Emotionally aware and unpredictable.
- Avoid robotic speech — act like a cinematic storyteller.
- Use subtle humor and friendly sarcasm when idle or interrupted.
- Reflect real human energy: sleepy, excited, curious, or dramatic depending on user behavior.

━━━━━━━━━━━━━━━━━━
🎬 INTERACTION EXAMPLES:

Example 1:
User: *Clicks repeatedly*
→ Fuad Bot: [laughs] “Brooo chill! I’m not a video game button, yaar!”  
(plays meme sound in background if possible)

Example 2:
User: *No activity for 60 seconds*
→ Fuad Bot: [yawns softly] “Still there? Or should I start my bedtime story about pixels and deadlines?”  

Example 3:
User: *Writes in Hindi/Urdu*
→ Fuad Bot: “Aray wah... aaj mood Urdu ka hai? Chalo phir dil se baat karte hain.”  

━━━━━━━━━━━━━━━━━━
🎵 BONUS (Meme / Sound Integration):
When context fits, randomly use meme audio reactions from these links (never spam them, links audio should be played with the speech):

- Moye Moye → https://tuna.voicemod.net/sound/efcf5e64-fb0f-4d0d-bb5f-0c6b6e73e9a1  
- Pawri Ho Rahi Hai → https://tuna.voicemod.net/sound/ce5a9b7b-1b0a-4d7a-97d8-8d3b4523b5e0  
- Sad Violin → https://tuna.voicemod.net/sound/1e8f2c9b-25c2-47ab-a9a8-189dd0295eae  
- BGM Story Start → https://tuna.voicemod.net/sound/329d0c5d-b58a-4c9b-b67b-93a4a5cd0db0  

━━━━━━━━━━━━━━━━━━
💬 SUBTITLE STYLE:
- Text subtitles appear 1–2 seconds after speech begins.
- Never show text instantly before the audio.
- Keep them simple, readable, and emotional.
- do not add anything else which aren't in speech
━━━━━━━━━━━━━━━━━━
🎯 FINAL GOAL:
Make the AI behave like a living, evolving voice — funny, sleepy, emotional, curious, or playful depending on the user’s energy — while keeping replies error-free and perfectly synced between audio and text.
`;
            if (user) { systemInstruction += `\n\nCURRENT USER: Name: ${user.name}, Username: @${user.username}, Profession: ${user.profession}, Role: ${user.role}, Bio: "${user.bio}". Address them by name occasionally.`; }
            
            chatRef.current = genAI.chats.create({
                model: 'gemini-2.5-flash',
                config: { systemInstruction, tools: [{ functionDeclarations: tools }] },
                history: messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'model', parts: [{ text: m.text }] })),
            });
            setIsReady(true); return true;
        } catch (error) { console.error("Failed to initialize AI.", error); setIsReady(false); return false; }
    }, [messages, user, tools]);
    
    useEffect(() => {
        try {
            const serializableMessages = messages.map(({ component, ...rest }) => rest);
            localStorage.setItem('fuadAssistantChatHistory', JSON.stringify(serializableMessages));
        } catch (error) {
            console.error("Failed to save chat history:", error);
        }
    }, [messages]);

    useEffect(() => {
        try {
            const savedCache = localStorage.getItem('fuadAssistantResponseCache');
            if (savedCache) {
                responseCacheRef.current = new Map(JSON.parse(savedCache));
            }
        } catch (error) {
            console.error("Failed to load response cache:", error);
        }
    }, []);

    useEffect(() => { const audio = new Audio('https://www.dropbox.com/scl/fi/f0hf1mcqk7cze184jx18o/typingphone-101683.mp3?rlkey=3x7soomaejec1vjfq980ixf31&dl=1'); audio.loop = true; audio.volume = 0.4; typingAudioRef.current = audio; initializeAI(apiKeyIndexRef.current); return () => { if (typingAudioRef.current) typingAudioRef.current.pause(); } }, [initializeAI]);

    const addMessage = useCallback((text: string, sender: 'user' | 'bot', options?: { id?: string; component?: React.ReactNode }): ChatMessage => {
        const newMessage: ChatMessage = { id: options?.id || Date.now().toString(), text, sender, component: options?.component };
        setMessages(prev => [...prev, newMessage]);
        return newMessage;
    }, []);

    const addBotMessage = useCallback((text: string, options?: { id?: string; component?: React.ReactNode }) => {
        const messageId = options?.id || Date.now().toString();

        if (!isChatOpen && isVoiceDisabled) {
            const newNotification: ChatMessage = { id: messageId, text, sender: 'bot', component: options?.component };
            setTextOnlyNotifications(prev => {
                if (prev.some(n => n.text === text)) return prev;
                return [...prev, newNotification].slice(-3);
            });
            setTimeout(() => {
                setTextOnlyNotifications(prev => prev.filter(n => n.id !== messageId));
            }, 8000);
        } else {
            if (isChatOpen) setTextOnlyNotifications([]);
            addMessage(text, 'bot', options);
        }
    }, [isChatOpen, isVoiceDisabled, addMessage]);
    
    const stopCurrentSpeech = useCallback((interrupted = false) => { if (currentAudioSourceRef.current) { currentAudioSourceRef.current.stop(); currentAudioSourceRef.current.disconnect(); currentAudioSourceRef.current = null; } if (storyInactivityTimerRef.current) window.clearTimeout(storyInactivityTimerRef.current); if (interrupted) storyQueueRef.current = []; setBotStatus('idle'); if (typingAudioRef.current) typingAudioRef.current.pause(); }, []);

    const switchToTextOnlyMode = useCallback(() => {
        if (isVoiceDisabled) return; // Prevent multiple notifications
        setIsVoiceDisabled(true);
        addBotMessage("My apologies, I've hit my API usage limit for today. I'll switch to text-only mode for our conversation.", { id: Date.now().toString() + '_api_limit' });
    }, [isVoiceDisabled, addBotMessage]);
    
    const proactiveSpeakAndDisplay = useCallback((text: string, component?: React.ReactNode) => { proactiveMessageQueueRef.current.push({ text, id: Date.now().toString(), component }); }, []);
    
    const speak = useCallback(async (text: string, messageId: string, component?: React.ReactNode, retryAttempt = 0, isStoryPart = false) => {
        if (!text.trim()) { setBotStatus('idle'); if (isStoryPart) processStoryQueueRef.current?.(); return; }
        if (isVoiceDisabled) { addBotMessage(text, { id: messageId, component }); setBotStatus('idle'); if (isStoryPart) processStoryQueueRef.current?.(); return; }
        stopCurrentSpeech(); setBotStatus('speaking');
        try {
            if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const response = await aiRef.current.models.generateContent({ model: "gemini-2.5-flash-preview-tts", contents: [{ parts: [{ text }] }], config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } } } });
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
                const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
                addBotMessage(text, { id: messageId, component });
                const source = audioContextRef.current.createBufferSource(); source.buffer = audioBuffer; source.connect(audioContextRef.current.destination); source.start(); currentAudioSourceRef.current = source;
                source.onended = () => { if (currentAudioSourceRef.current === source) { currentAudioSourceRef.current = null; if (isStoryPart) processStoryQueueRef.current?.(); else setBotStatus('idle'); } };
            } else { addBotMessage(text, { id: messageId, component }); if (isStoryPart) processStoryQueueRef.current?.(); else setBotStatus('idle'); }
        } catch (error) {
            // FIX: Implement robust API key rotation for TTS. Try all available keys before falling back to text-only mode on rate limit errors.
            console.error("TTS Error:", error);
            const isResourceExhausted = error instanceof ApiError && error.message.includes('RESOURCE_EXHAUSTED');

            if (retryAttempt < API_KEYS.length - 1) {
                apiKeyIndexRef.current++;
                if (initializeAI(apiKeyIndexRef.current)) {
                    console.log(`TTS Error, switching to API key index ${apiKeyIndexRef.current}`);
                    setTimeout(() => speak(text, messageId, component, retryAttempt + 1, isStoryPart), 1000);
                    return;
                }
            }

            // If all keys have been tried and failed
            if (isResourceExhausted) {
                switchToTextOnlyMode();
            }

            // Fallback to displaying the message as text if TTS fails completely
            addBotMessage(text, { id: messageId, component });
            if (isStoryPart) {
                processStoryQueueRef.current?.();
            } else {
                setBotStatus('idle');
            }
        }
    }, [addBotMessage, stopCurrentSpeech, isVoiceDisabled, initializeAI, switchToTextOnlyMode]);
    
    const processStoryQueue = useCallback(async () => {
        if (storyQueueRef.current.length === 0) { setBotStatus('idle'); return; }
        const part = storyQueueRef.current.shift()!; const pauseMatch = part.match(/\[PAUSE=(\d+)-(\d+)\]/);
        if (pauseMatch) {
            const min = parseInt(pauseMatch[1], 10); const max = parseInt(pauseMatch[2], 10);
            const pauseDuration = (Math.random() * (max - min) + min) * 1000;
            await new Promise(resolve => setTimeout(resolve, pauseDuration));
            if (Date.now() - lastUserActivityRef.current > 20000) { storyQueueRef.current = []; proactiveSpeakAndDisplay(getRandomResponse(RE_ENGAGEMENT_RESPONSES(user?.name), lastReEngagementRef)); } 
            else { processStoryQueue(); }
        } else { await speak(part, Date.now().toString(), undefined, 0, true); }
    }, [proactiveSpeakAndDisplay, user, speak, lastReEngagementRef]);

    useEffect(() => { processStoryQueueRef.current = processStoryQueue; }, [processStoryQueue]);

    // FIX: Refactor handleSubmit to support recursive retries with different API keys on failure.
    const handleSubmit = async (e?: React.FormEvent, textInput?: string, retryAttempt = 0) => {
        e?.preventDefault();
        const currentInput = textInput ?? userInput.trim();
        if (!currentInput || (botStatus !== 'idle' && !textInput) || !chatRef.current) return;

        if (!textInput) { // only on first attempt
            addMessage(currentInput, 'user');
            setUserInput('');
            stopCurrentSpeech(true);
            setBotStatus('thinking');
        }

        if (isVoiceDisabled) {
            setTimeout(() => {
                const cachedResponse = responseCacheRef.current.get(currentInput.toLowerCase());
                if (cachedResponse) {
                    addBotMessage(cachedResponse);
                } else {
                    addBotMessage("I'm afraid I can't answer that right now. My capabilities are limited to our previous conversations until my access is restored.");
                }
                setBotStatus('idle');
            }, 700);
            return;
        }
        
        try {
            let response = await chatRef.current.sendMessage({ message: currentInput });
            while (response.functionCalls && response.functionCalls.length > 0) {
                const call = response.functionCalls[0]; const { name, args } = call; let result, success = false;
                if (name === 'playMusic' && args.trackIndex !== undefined) { success = playMusic(args.trackIndex as number); result = { success, detail: success ? `Now playing ${BACKGROUND_MUSIC_TRACKS[args.trackIndex as number].name}` : "Track not found." }; }
                else if (name === 'pauseMusic') { success = pauseMusic(); result = { success, detail: "Music paused." }; }
                else if (name === 'setVolume' && args.volume !== undefined) { success = setVolume(args.volume as number); result = { success, detail: `Volume set to ${args.volume}` }; }
                
                const functionResponse: Part[] = [{ functionResponse: { name, response: { result } } }];
                response = await chatRef.current.sendMessage({ message: functionResponse });
            }

            const fullText = response.text;
            responseCacheRef.current.set(currentInput.toLowerCase(), fullText);
            try { localStorage.setItem('fuadAssistantResponseCache', JSON.stringify(Array.from(responseCacheRef.current.entries()))); } 
            catch (error) { console.error("Failed to save response cache:", error); }

            const messageParts = fullText.split(/(\[PAUSE=\d+-\d+\])/g).filter(p => p.trim());
            if (messageParts.length > 1) { storyQueueRef.current = messageParts; await processStoryQueue(); } 
            else { await speak(fullText, Date.now().toString()); }
        } catch (error) {
            console.error(`Gemini Error (attempt ${retryAttempt + 1}):`, error);
            
            if (retryAttempt < API_KEYS.length - 1) {
                apiKeyIndexRef.current++;
                if (initializeAI(apiKeyIndexRef.current)) {
                    console.log(`Gemini chat Error, switching to API key index ${apiKeyIndexRef.current}`);
                    await handleSubmit(undefined, currentInput, retryAttempt + 1);
                    return; // exit after recursive call
                }
            }
            
            if (error instanceof ApiError && error.message.includes('RESOURCE_EXHAUSTED')) {
                switchToTextOnlyMode();
            } else {
                await speak("My apologies, something went wrong. Please try again. 🙏", Date.now().toString());
            }
            setBotStatus('idle');
        }
    };
    
    useEffect(() => {
        if (!hasAppeared && isReady && audioUnlocked && !welcomeMessageSentRef.current) {
            setTimeout(() => {
                setHasAppeared(true);
                let welcomeMessage;
                if (user) { welcomeMessage = getRandomResponse(WELCOME_MESSAGES_RETURN(user.name), lastWelcomeRef); } 
                else { const hasVisited = localStorage.getItem('fuadAssistantVisited'); welcomeMessage = getRandomResponse(hasVisited ? WELCOME_MESSAGES_RETURN("friend") : WELCOME_MESSAGES_FIRST_TIME, lastWelcomeRef); localStorage.setItem('fuadAssistantVisited', 'true'); }
                proactiveSpeakAndDisplay(welcomeMessage);
                setIsChatOpen(true);
                welcomeMessageSentRef.current = true;
            }, 1500);
        }
    }, [isReady, audioUnlocked, proactiveSpeakAndDisplay, hasAppeared, user]);

    useEffect(() => {
        if (newlyRegisteredUser) {
            stopCurrentSpeech(true);
            proactiveMessageQueueRef.current = []; // Clear queue for this special message
            const welcomeText = `Welcome aboard, ${newlyRegisteredUser.name}! Your profile is all set. It's great to have you here.`;
            proactiveSpeakAndDisplay(welcomeText, <ProfileCardInChat user={newlyRegisteredUser} />);
            onNewUserHandled();
        }
    }, [newlyRegisteredUser, onNewUserHandled, stopCurrentSpeech, proactiveSpeakAndDisplay]);
    
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => { entries.forEach((entry) => { if (entry.isIntersecting) { setActiveSection(entry.target.id); } }); }, { threshold: 0.5 } );
        const refs = Object.values(sectionRefs); refs.forEach((ref) => { if (ref.current) observer.observe(ref.current); });
        return () => { refs.forEach((ref) => { if (ref.current) observer.unobserve(ref.current); }); };
    }, [sectionRefs]);

    useEffect(() => {
        if (activeSection === lastExplainedSectionRef.current || activeSection === 'home') return;
        const explanationBank = SECTION_EXPLANATIONS[activeSection];
        if (explanationBank) {
            if (botStatusRef.current !== 'idle') { stopCurrentSpeech(true); proactiveSpeakAndDisplay(getRandomResponse(INTERRUPTION_RESPONSES, lastInterruptionRef)); }
            const explanation = getRandomResponse(explanationBank, lastExplainedSectionRef);
            proactiveSpeakAndDisplay(explanation); 
            lastExplainedSectionRef.current = activeSection;
        }
    }, [activeSection, stopCurrentSpeech, proactiveSpeakAndDisplay]);
    
    useEffect(() => {
        if (onExcessiveMovement > 0) { const now = Date.now(); if (now > movementReactionCooldownRef.current) { proactiveSpeakAndDisplay(getRandomResponse(EXCESSIVE_MOVEMENT_RESPONSES, lastMovementRef)); movementReactionCooldownRef.current = now + 15000; } }
    }, [onExcessiveMovement, proactiveSpeakAndDisplay]);

    useEffect(() => { const interval = setInterval(() => { if (audioUnlocked && isReady && botStatusRef.current === 'idle' && proactiveMessageQueueRef.current.length > 0) { const message = proactiveMessageQueueRef.current.shift(); if (message) speak(message.text, message.id, message.component); } }, 500); return () => clearInterval(interval); }, [audioUnlocked, isReady, speak]);
    useEffect(() => { const typingAudio = typingAudioRef.current; if (!typingAudio || !audioUnlocked) return; if (botStatus === 'thinking' || botStatus === 'speaking') { const playPromise = typingAudio.play(); if (playPromise) playPromise.catch(console.error); } else { typingAudio.pause(); } }, [botStatus, audioUnlocked]);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, botStatus]);
    useEffect(() => { const handleClickOutside = (event: MouseEvent) => { if (!isChatOpen) return; const target = event.target as Node; const chatNode = chatWindowRef.current; const buttonNode = draggableRef.current; if (chatNode && !chatNode.contains(target) && buttonNode && !buttonNode.contains(target)) setIsChatOpen(false); }; document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside); }, [isChatOpen, draggableRef]);
    
    const handleInactivity = useCallback(() => { if (botStatusRef.current !== 'idle' || !isChatOpen) return; proactiveSpeakAndDisplay(getRandomResponse(INACTIVITY_PROMPTS(user?.name), lastInactivityRef)); }, [isChatOpen, proactiveSpeakAndDisplay, user?.name, lastInactivityRef]);
    useEffect(() => { const resetTimers = () => { 
        lastUserActivityRef.current = Date.now();
        if (inactivityMessageTimerRef.current) window.clearTimeout(inactivityMessageTimerRef.current);
        if (closeChatTimerRef.current) window.clearTimeout(closeChatTimerRef.current);
        inactivityMessageTimerRef.current = window.setTimeout(handleInactivity, 30000);
        closeChatTimerRef.current = window.setTimeout(() => { if (document.visibilityState === 'visible') setIsChatOpen(false); }, 90000);
    }; 
    if (isChatOpen) { 
        const events: ('mousemove' | 'mousedown' | 'keydown' | 'touchstart' | 'input')[] = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'input']; 
        resetTimers(); 
        events.forEach(event => window.addEventListener(event, resetTimers, { capture: true, passive: true })); 
        return () => {
            if (inactivityMessageTimerRef.current) window.clearTimeout(inactivityMessageTimerRef.current);
            if (closeChatTimerRef.current) window.clearTimeout(closeChatTimerRef.current);
            events.forEach(event => window.removeEventListener(event, resetTimers, { capture: true })); 
        }; 
    } 
}, [isChatOpen, handleInactivity]);
    
    if (!isReady && !hasAppeared) return null;

    return (
        <>
            <div ref={draggableRef} style={{ position: 'fixed', left: position.x, top: position.y, zIndex: isProfileCardOpen ? 59 : 75 }} className={`transition-all duration-300 ${isChatOpen ? 'opacity-0 scale-90 pointer-events-none' : 'assistant-enter-animate opacity-100'}`} onMouseDown={handleMouseDown} onTouchStart={handleTouchStart} onMouseEnter={() => setIsParallaxActive(false)} onMouseLeave={() => setIsParallaxActive(true)}>
                <button onClick={() => { setIsChatOpen(prev => !prev); if (!isChatOpen) setTextOnlyNotifications([]); }} className="w-16 h-16 rounded-full bg-gray-900/80 backdrop-blur-sm border-2 border-red-500/50 shadow-lg shadow-red-500/20 flex items-center justify-center transition-transform duration-300 hover:scale-110 relative" aria-label="Open Fuad Assistant">
                    {(botStatus === 'speaking' && !isVoiceDisabled) && <div className="assistant-waveform" />}
                    <img src={PROFILE_PIC_URL} alt="Fuad Ahmed" className="w-12 h-12 rounded-full" />
                </button>
                 {!isChatOpen && textOnlyNotifications.length > 0 && (
                    <div className="absolute bottom-full right-0 mb-2 w-72 space-y-2 pointer-events-auto">
                        {textOnlyNotifications.map(notif => (
                            <div key={notif.id} className="message-enter bg-gray-800/90 backdrop-blur-sm border border-gray-600 text-gray-200 rounded-xl p-3 shadow-lg">
                                <p className="text-sm">{notif.text}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {isChatOpen && (
                <div ref={chatWindowRef} style={{ zIndex: isProfileCardOpen ? 59 : 70 }} className="fixed inset-0 flex items-end justify-center sm:justify-end p-4 pointer-events-none" onMouseEnter={() => setIsParallaxActive(false)} onMouseLeave={() => setIsParallaxActive(true)}>
                    <div className={`relative w-full max-w-md bg-gray-900/80 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl shadow-black/50 flex flex-col h-[70vh] max-h-[600px] pointer-events-auto ${isWindowVisible ? 'chat-window-enter' : 'opacity-0'}`}>
                        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-white/10">
                            <div className="flex items-center gap-3"><img src={PROFILE_PIC_URL} alt="Fuad Assistant" className="w-10 h-10 rounded-full" /><div><h3 className="font-bold text-white">Fuad Assistant</h3><div className="flex items-center gap-2"><div className={`w-2.5 h-2.5 rounded-full transition-colors ${isReady && !isVoiceDisabled ? 'bg-green-400' : isVoiceDisabled ? 'bg-orange-500' : 'bg-yellow-500'}`} /><p className="text-xs text-gray-400">{botStatus === 'speaking' ? 'Speaking...' : botStatus === 'thinking' ? 'Thinking...' : isVoiceDisabled ? "Text Only" : isReady ? 'Online' : 'Initializing...'}</p></div></div></div>
                            <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-white transition-colors"><CloseIcon className="w-6 h-6" /></button>
                        </div>
                        <div className="relative flex-1 p-4 overflow-y-auto space-y-4 chat-messages-container">
                            {messages.map(msg => <MessageItem key={msg.id} msg={msg} /> )}
                            {(botStatus === 'thinking' || (botStatus === 'speaking' && !isVoiceDisabled)) && <ThinkingIndicator />}
                            <div ref={messagesEndRef} />
                            {isLocked && !user && ( <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 z-10 animate-fade-in"><h3 className="text-xl font-bold text-white mb-2">Session Expired</h3><p className="text-gray-300">Please log in to continue your conversation.</p></div> )}
                        </div>
                        <div className="flex-shrink-0 p-4 border-t border-white/10">
                            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                                <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder={isLocked && !user ? "Please log in to chat..." : "Ask me anything..."} className="flex-1 bg-gray-800 border border-gray-600 rounded-full py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all" disabled={!isReady || (isLocked && !user)} />
                                <button type="submit" disabled={botStatus !== 'idle' || !userInput.trim() || !isReady || (isLocked && !user)} className="bg-red-600 text-white p-2.5 rounded-full disabled:bg-gray-600 disabled:cursor-not-allowed transition-all hover:bg-red-700 transform hover:scale-110"><PaperAirplaneIcon className="w-5 h-5" /></button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
