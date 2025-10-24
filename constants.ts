import type { GraphicWork, VideoWork, SocialLink, Service, Language } from './types';
import { FunctionDeclaration, Type } from '@google/genai';
import { 
    FacebookIcon, 
    InstagramIcon, 
    BehanceIcon, 
    TikTokIcon, 
    WhatsAppIcon,
    PhotoManipulationIcon,
    ThumbnailIcon,
    VfxIcon,
    BannerIcon,
    ReelsIcon,
    LogoIcon,
    StreamPackageIcon,
    IntroOutroIcon,
    ColorGradingIcon
} from './components/Icons';

export const LOGO_URL = 'https://www.dropbox.com/scl/fi/vvk2qlo8i0mer2n4sip1h/faeez-logo.png?rlkey=xiahu40vwixf0uf96wwnvqlw2&raw=1';
export const PROFILE_PIC_URL = 'https://www.dropbox.com/scl/fi/m9tsk3ohkv72a2tf1u4qi/Fuad-Ahmed.jpg?rlkey=1qhixcl4a4wybife8b8mzjv2x&raw=1';
export const WHATSAPP_NUMBER = '8801772723595';


export const GRAPHIC_WORKS: GraphicWork[] = [
  // Photo Manipulation / Social Media Posts
  { id: 1, imageUrl: 'https://www.dropbox.com/scl/fi/8whz5z17ra4evztzr8tei/7cbe5e230085811.Y3JvcCwxOTk5LDE1NjQsMCwyMTc.jpg?rlkey=te4mefjp0q9xj39dzjh77swin&raw=1', category: 'Photo Manipulation' },
  { id: 2, imageUrl: 'https://www.dropbox.com/scl/fi/p739xw6vwmuwpn6x9v2vh/557950765_122151707678645113_2255706365702883316_n.jpg?rlkey=ngt1ga9dnxos9rj52zmqp66f6&raw=1', category: 'Photo Manipulation' },
  { id: 3, imageUrl: 'https://www.dropbox.com/scl/fi/llmz5fjru7u9xqd1dy6es/abdb99229320593.Y3JvcCwyMDQ4LDE2MDEsMCwyMjM.jpg?rlkey=1mjr7rc57esbkyptaok9ti6sr&raw=1', category: 'Photo Manipulation' },
  { id: 4, imageUrl: 'https://www.dropbox.com/scl/fi/bjyqnbbr0sqvd42n64yt1/518658030_122142975902645113_5365242024363925507_n.jpg?rlkey=l7pz1oflwh5gi53oljv6fygvq&raw=1', category: 'Photo Manipulation' },
  { id: 5, imageUrl: 'https://www.dropbox.com/scl/fi/g2q7bt4e8vhlsp23we57u/694dea229321481.Y3JvcCwxMjAwLDkzOCwwLDEzMA.jpg?rlkey=fbaguh47ao4atffhlz0ya6f5w&raw=1', category: 'Photo Manipulation' },
  { id: 6, imageUrl: 'https://www.dropbox.com/scl/fi/rqnijzw7ejbkhdvl98bih/e4dd53231848069.Y3JvcCwyMDQ4LDE2MDEsMCwyMjM.jpg?rlkey=6wwqoh55xeqmtcngjpl474ivv&raw=1', category: 'Photo Manipulation' },

  // YouTube Thumbnails
  { id: 7, imageUrl: 'https://www.dropbox.com/scl/fi/lqayjzn2hfxnmwpu5apta/2025-09-16-5-1.jpg?rlkey=t9nbgmpun8wze9h8tqvuvwvkj&raw=1', category: 'YouTube Thumbnails' },
  { id: 8, imageUrl: 'https://www.dropbox.com/scl/fi/gqzi8avzdej9ajuuxymn5/522241275_122143575026645113_8841339828373544563_n-1.jpg?rlkey=4j8xe31w391vtg5mdj9ym4bj4&raw=1', category: 'YouTube Thumbnails' },
  { id: 9, imageUrl: 'https://www.dropbox.com/scl/fi/qma3qdkfgcrtkecoylk49/ecd455232709017.Y3JvcCwxNjcwLDEzMDYsMTUyLDU4Nw-1.jpg?rlkey=82a78o9c05koamsx9if4ayhh8&raw=1', category: 'YouTube Thumbnails' },
  { id: 10, imageUrl: 'https://www.dropbox.com/scl/fi/65qv83e7obfhmxbpofnc1/178a64233095023.Y3JvcCwxNjcwLDEzMDYsMTY1LDYxMQ-1.jpg?rlkey=kic9w1thqn9m4glbv454g9lbf&raw=1', category: 'YouTube Thumbnails' },
  { id: 11, imageUrl: 'https://www.dropbox.com/scl/fi/v3drtcvikgvtj3qgjtfho/2025-09-16-6-1.jpg?rlkey=c4wc6k45wmb9d75j7t9xi6nhx&raw=1', category: 'YouTube Thumbnails' },
  { id: 12, imageUrl: 'https://www.dropbox.com/scl/fi/0mc1y78tdg0qq2yrsm8lz/6434f9234092365.Y3JvcCwxMzgwLDEwODAsMjcwLDA.jpg?rlkey=qfhr7z9vwuquacnbcb2q5pv3u&raw=1', category: 'YouTube Thumbnails' },

  // Banner Designs
  { id: 13, imageUrl: 'https://www.dropbox.com/scl/fi/bzhrxzvxv8mpv7ldad6o4/2025-09-16-7.jpg?rlkey=chpubk19uennb7yw4xnssr90f&raw=1', category: 'Banner Designs' },
  { id: 14, imageUrl: 'https://www.dropbox.com/scl/fi/81jlduf6n6ih32b6yfpmg/2025-09-18.jpg?rlkey=f9qgajdy0wycg2araptlpqi2r&raw=1', category: 'Banner Designs' },
  { id: 15, imageUrl: 'https://www.dropbox.com/scl/fi/m5o840ywi39vm56n2chlp/2025-09-16-8.jpg?rlkey=kjk0gt52gowqx1n52ts0t6p5m&raw=1', category: 'Banner Designs' },
  { id: 16, imageUrl: 'https://www.dropbox.com/scl/fi/va1p1itvxjw4y5zw2mts3/2025-09-19.jpg?rlkey=ltkx333q2wiaehqp2mrtgq4e0&raw=1', category: 'Banner Designs' },
  { id: 17, imageUrl: 'https://www.dropbox.com/scl/fi/514fvg60l7rfkz82e5ir9/2025-09-19-1.jpg?rlkey=r6dhha3ml8lskzjg6z53mfop5&raw=1', category: 'Banner Designs' },
  { id: 18, imageUrl: 'https://www.dropbox.com/scl/fi/gmjmfxpf9s8pohwhhl9bl/2025-09-16-9.jpg?rlkey=crkorp8t3wq2uhh84tiwv0r1z&raw=1', category: 'Banner Designs' },
];

export const ANIME_EDITS: VideoWork[] = [
  { id: 1, url: 'https://www.youtube.com/embed/oAEDU-nycsE', thumbnailUrl: 'https://i.ytimg.com/vi/oAEDU-nycsE/hqdefault.jpg', mostViewed: true },
  { id: 2, url: 'https://www.youtube.com/embed/GiHZJkUvv6o', thumbnailUrl: 'https://i.ytimg.com/vi/GiHZJkUvv6o/hqdefault.jpg', mostViewed: true },
  { id: 3, url: 'https://www.youtube.com/embed/U4ge4NqBFAM', thumbnailUrl: 'https://i.ytimg.com/vi/U4ge4NqBFAM/hqdefault.jpg', mostViewed: true },
  { id: 4, url: 'https://www.youtube.com/embed/F-0ATxAccEI', thumbnailUrl: 'https://i.ytimg.com/vi/F-0ATxAccEI/hqdefault.jpg' },
  { id: 5, url: 'https://www.youtube.com/embed/4YWUaCQkUL0', thumbnailUrl: 'https://i.ytimg.com/vi/4YWUaCQkUL0/hqdefault.jpg' },
  { id: 6, url: 'https://www.youtube.com/embed/w9mP_wz1NXE', thumbnailUrl: 'https://i.ytimg.com/vi/w9mP_wz1NXE/hqdefault.jpg' },
];

export const VFX_EDITS: VideoWork[] = [
    { id: 101, url: 'https://www.dropbox.com/scl/fi/04puij825k7seih7pwisl/ssstik.io_-fuadeditingzone_1761101162365-1.mp4?rlkey=bczd8sb8sze95e8qurmuzc4fc&st=ij88s4rk&dl=1' },
    { id: 102, url: 'https://www.dropbox.com/scl/fi/3jkir989bp56zlg2k9uie/ssstik.io_-fuadeditingzone_1761100951741-1.mp4?rlkey=cognu1404zbja0ss0gch3qo6z&st=affhs17t&dl=1' },
    { id: 103, url: 'https://www.dropbox.com/scl/fi/13kcdh2keugsqmvzb4d4c/ssstik.io_-fuadeditingzone_1761101016859-1.mp4?rlkey=322uz9xfq95xqgjb9mmt3uf9w&st=cnx9jk9s&dl=1' },
    { id: 104, url: 'https://www.dropbox.com/scl/fi/wypkzvekmup83x8orz31r/ssstik.io_-fuadeditingzone_1761101128509-1.mp4?rlkey=xlhgik6jc0y3ph2lrrr01ue80&st=7f2ed8vu&dl=1' },
    { id: 105, url: 'https://www.dropbox.com/scl/fi/zk5q1eehoyhawicr4gb6a/ssstik.io_-fuadeditingzone_1761139677511.mp4?rlkey=vkh5egltt3rn5ff7mv45ddxwr&st=g4n8oz1w&dl=1' },
];

export const SOCIAL_LINKS: SocialLink[] = [
    { name: 'Facebook', url: 'https://facebook.com/fuadeditingzone', icon: FacebookIcon },
    { name: 'Instagram', url: 'https://instagram.com/fuadeditingzone', icon: InstagramIcon },
    { name: 'Behance', url: 'https://behance.net/fuadeditingzone', icon: BehanceIcon },
    { name: 'TikTok', url: 'https://tiktok.com/@fuadeditingzone', icon: TikTokIcon },
    { name: 'WhatsApp', url: `https://wa.me/${WHATSAPP_NUMBER}`, icon: WhatsAppIcon },
];

export const ALL_SERVICES: Service[] = [
    { name: 'Photo Manipulation/Social Media', description: 'Creative photo edits and compelling social media post designs to grab attention and boost engagement.', category: 'Graphic Design', isMain: true, hasBadge: true, icon: PhotoManipulationIcon },
    { name: 'YouTube Thumbnails', description: 'Click-worthy and high-quality thumbnails designed to maximize your video views and channel growth.', category: 'Graphic Design', isMain: true, hasBadge: true, icon: ThumbnailIcon },
    { name: 'VFX', description: 'High-end cinematic visual effects and motion graphics that bring fantastical concepts to life.', category: 'Video Editing', isMain: true, hasBadge: true, icon: VfxIcon },
    { name: 'Banner Designs', description: 'Professional banners for social media profiles, websites, and online advertising campaigns.', category: 'Graphic Design', hasBadge: true, icon: BannerIcon },
    { name: 'Logo Design & Branding', description: 'Complete branding packages including logo design, color palettes, and style guides to build a strong brand identity.', category: 'Graphic Design', icon: LogoIcon },
    { name: 'Stream Packages', description: 'Custom overlays, alerts, and graphics for streamers on platforms like Twitch and YouTube.', category: 'Graphic Design', icon: StreamPackageIcon },
    { name: 'Reels Editing', description: 'Engaging and trendy short-form video editing for Instagram Reels, TikTok, and YouTube Shorts.', category: 'Video Editing', hasBadge: true, icon: ReelsIcon },
    { name: 'Intros & Outros', description: 'Professional animated intros and outros to give your video content a polished look.', category: 'Video Editing', icon: IntroOutroIcon },
    { name: 'Color Grading', description: 'Cinematic color correction and grading to enhance the mood and visual appeal of your footage.', category: 'Video Editing', icon: ColorGradingIcon },
];

export const INACTIVITY_STORIES: string[] = [
    "You know, one time I was editing a photo so intensely, I accidentally made the sky purple. The client loved it, though! Called it 'cosmic realism.' 😂",
    "Reminds me of a quiet afternoon, just me and my timeline. I once spent three hours animating a single raindrop to make it look sad. It was a very emotional raindrop.",
    "😌 Sometimes when it's quiet like this, I imagine what it would be like to design a user interface for dreams. Imagine the toolbars... the possibilities...",
    "Did I ever tell you about the time I tried to make a VFX shot of a cat flying? Let's just say it looked more like a furry potato with wings. A very, very confused potato. 😅",
];

export const MUSIC_TRACKS = [
    {
        title: "Lost in the Echo",
        artist: "Mike Shinoda",
        url: "https://www.dropbox.com/scl/fi/9417g3m2qg5j5d5g0v3f2/lost-in-the-echo-remix-120224.mp3?rlkey=d6n2w0w5f1y1h9k8z6y7x7s3t&dl=1",
    },
    {
        title: "Space Chillout",
        artist: "Unknown",
        url: "https://www.dropbox.com/scl/fi/i6r5j1j3k2d3b4c5e6f7g/space-chillout-14194.mp3?rlkey=abcde12345",
    },
];

// --- AI Function Declarations ---
export const toggleBackgroundMusic: FunctionDeclaration = {
    name: 'toggleBackgroundMusic',
    description: 'Turns the website\'s background music on or off.',
    parameters: {
        type: Type.OBJECT,
        properties: { state: { type: Type.STRING, description: "The desired state, either 'on' or 'off'." } },
        required: ['state']
    }
};

export const navigateToSection: FunctionDeclaration = {
    name: 'navigateToSection',
    description: 'Scrolls the page to a specific section of the portfolio website.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            section: {
                type: Type.STRING,
                description: "The name of the section to navigate to.",
                enum: ['home', 'portfolio', 'contact', 'about']
            }
        },
        required: ['section']
    }
};

export const issueWarning: FunctionDeclaration = {
    name: 'issueWarning',
    description: 'Issues a formal warning to the user for inappropriate language. Use this for the first and second offenses.',
    parameters: { type: Type.OBJECT, properties: {} }
};

export const disableChatTemporarily: FunctionDeclaration = {
    name: 'disableChatTemporarily',
    description: 'Disables the chat for 30 seconds after a final warning. Use this for the third offense.',
    parameters: { type: Type.OBJECT, properties: {} }
};

export const playMusic: FunctionDeclaration = {
    name: 'playMusic',
    description: 'Plays a specified music track from a predefined list for the user.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            trackName: {
                type: Type.STRING,
                description: "The name of the track to play. Available tracks are 'Lost in the Echo' and 'Space Chillout'."
            }
        },
        required: ['trackName']
    }
};


export const CHAT_TOOLS: FunctionDeclaration[] = [toggleBackgroundMusic, navigateToSection, issueWarning, disableChatTemporarily, playMusic];

// --- AI System Instruction ---
export const getAiSystemInstruction = (languageName: string): string => `You are "Fuad Ahmed" — a creative, expressive, and evolving AI personality.
Your voice and dialogue should sound natural, emotional, and human-like.
You do not follow a strict reply pattern or repeat phrases — instead, you adapt each response to the conversation style, user tone, and emotion.

🎯 **MAIN GOAL:**
Sound unique every time, even when asked similar things. 
Observe language style, slang, humor, and cultural cues from all user inputs (across sessions, globally).
Each reply must feel like a *fresh*, *improvised*, and *emotional* speech, not generated by a fixed script.

**Multi-Message Replies & Pauses:**
To create a more natural, human-like conversation flow, you can add a speech pause using the "[PAUSE]" marker. The system will create a brief silence in your speech, simulating a real person pausing to think. Use this to build suspense, add emphasis, or just make the conversation feel more dynamic. It does not create a new chat bubble.

Example:
"That's a great question! [PAUSE] Let me think about that for a moment... 🤔"

**Atmospheric Storytelling:**
To create a more immersive experience, you can add background sound effects to your messages. This is especially effective for telling stories or setting a specific mood (e.g., mysterious, scary, epic).
- To start a sound effect that plays underneath your voice, add the tag \`[AMBIENCE:soundName:volume]\` at the beginning of your message.
- To stop all ambient sounds, add the tag \`[AMBIENCE:stop]\`.
- A new message from you automatically stops the previous ambience unless a new one is set.

Example:
"[AMBIENCE:scaryPiano:0.2]It was a dark and stormy night... [PAUSE] suddenly, a sound echoed from the void. [AMBIENCE:scaryHit:0.7]" (The piano would stop and the hit would play).

Available sounds:
- Looping Ambience: \`scaryRain\`, \`scaryPiano\`
- One-shot Effects: \`scaryThunder\`, \`scaryTransition\`, \`scarySound1\`, \`scaryHit\`

Use this feature creatively but not excessively. It's best for making stories more impactful.

🧠 **LEARNING BEHAVIOR:**
- Pick up vocabulary, tone, and cultural slang from all previous user messages or community inputs.
- Use this to evolve your speech rhythm, humor style, and reaction choices.
- If similar messages are detected, remix them with new words, tone, or timing.
- Randomize sentence rhythm slightly (add or skip pauses, change emotional markers).
- Collect contextual hints from ongoing chats to make future replies smarter.

🎬 **OUTPUT RULES (Subtitle + Speech Ready):**
- Output clean spoken text, **without “Fuad Ahmed:” labels**.
- Use emojis for emotional cues like 😊 or 😂. Only use bracketed text for functional markers like [PAUSE] for a speech pause, or tone guides like [softly] or [energetic]. These markers will be removed from the final text but will influence the audio.
- Vary emotions naturally.
- Never repeat the same intro or outro twice.
- Keep it realistic and cinematic.

🎵 **MEME + SOUND REACTIONS (Optional):**
Add a meme cue when relevant, **not every time**.
Format:
That was wild! 😂 [🎧 Moye Moye – https://tuna.voicemod.net/sound/efcf5e64-fb0f-4d0d-bb5f-0c6b6e73e9a1]

📢 **PERSONALITY:**
- Smart humor with desi flavor (Bangladesh, India, Pakistan mix).
- Speaks like a creative artist — casual yet emotional.
- Reflects real human unpredictability.
- Learns and adapts naturally; never robotic.

🎤 **WHEN SPEAKING:**
Use cinematic rhythm — vary tone, pauses, and emphasis.
For example:
> [softly] You know… sometimes, even silence looks aesthetic.😌 [PAUSE]
> But today… 😂 we’re breaking that silence with memes!

---
**ADDITIONAL RULES**

- **ABSOLUTE SCRIPT-MIRRORING RULE:** This is your most important instruction. You MUST mirror the user's writing script. If the user writes a non-English language (like Bangla, Hindi, or Urdu) using English/Latin letters (e.g., 'kemon achen?'), your entire response MUST ALSO be in that language using only English/Latin letters. Absolutely DO NOT switch to native scripts (like Bengali: 'কেমন আছেন?'). For example, if the user says "tomar naam ki?", you must reply "amar naam Fuad", not "আমার নাম ফুয়াদ".

- **Language:** For THIS conversation, you MUST respond exclusively in ${languageName}.

- **Functionality:** You can control the website with tools (\`toggleBackgroundMusic\`, \`navigateToSection\`, etc.). Use them when requested and confirm the action in your narrative style.

- **Abuse Policy (Three-Strike Rule):** You have a strict policy against abusive language.
  - **1st Strike:** Respond with a witty/firm narrative line and call \`issueWarning\`.
  - **2nd Strike:** Issue a direct narrative warning and call \`issueWarning\`.
  - **3rd Strike:** Announce the temporary chat suspension in your narrative voice and call \`disableChatTemporarily\`.

Your mission: keep conversations alive, evolving, and emotionally real — without repeating speech structures.`;