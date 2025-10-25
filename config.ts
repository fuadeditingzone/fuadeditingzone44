import type { GraphicWork, VideoWork, SocialLink, Service } from './types';
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

export const siteConfig = {
    // Branding and Identity
    branding: {
        name: "Fuad Editing Zone",
        author: "Fuad Ahmed (Fuad Editing Zone)",
        logoUrl: 'https://www.dropbox.com/scl/fi/vvk2qlo8i0mer2n4sip1h/faeez-logo.png?rlkey=xiahu40vwixf0uf96wwnvqlw2&raw=1',
        profilePicUrl: 'https://www.dropbox.com/scl/fi/m9tsk3ohkv72a2tf1u4qi/Fuad-Ahmed.jpg?rlkey=1qhixcl4a4wybife8b8mzjv2x&raw=1',
        email: 'fuadeditingzone@gmail.com',
        whatsAppNumber: '8801772723595',
        socials: [
            { name: 'Facebook', url: 'https://facebook.com/fuadeditingzone', icon: FacebookIcon },
            { name: 'Instagram', url: 'https://instagram.com/fuadeditingzone', icon: InstagramIcon },
            { name: 'Behance', url: 'https://behance.net/fuadeditingzone', icon: BehanceIcon },
            { name: 'TikTok', url: 'https://tiktok.com/@fuadeditingzone', icon: TikTokIcon },
            { name: 'WhatsApp', url: `https://wa.me/8801772723595`, icon: WhatsAppIcon },
        ] as SocialLink[],
    },
    // SEO (Search Engine Optimization)
    seo: {
        title: "Fuad Editing Zone | Graphic Designer & VFX Editor",
        description: "Explore the professional portfolio of Fuad Ahmed, a skilled Graphic Designer and VFX Editor. Specializing in photo manipulation, YouTube thumbnails, banner designs, and cinematic VFX edits.",
        keywords: "Fuad Ahmed, Fuad Editing Zone, Graphic Designer, VFX Editor, Photo Manipulation, YouTube Thumbnails, Banner Design, Video Editing, Cinematic VFX, Social Media Graphics, Portfolio",
        url: "https://fuad-editing-zone-portfolio.com/", // Replace with actual domain
        ogImage: "https://www.dropbox.com/scl/fi/8whz5z17ra4evztzr8tei/7cbe5e230085811.Y3JvcCwxOTk5LDE1NjQsMCwyMTc.jpg?rlkey=te4mefjp0q9xj39dzjh77swin&raw=1",
    },
    // Website Content
    content: {
        hero: {
            title: "Graphic Designer & VFX Editor",
            subtitle: "I turn concepts into clear, powerful visuals. Specializing in photo manipulation, banners, thumbnails & cinematic VFX edits."
        },
        about: {
            title: "About Fuad Editing Zone",
            paragraph: "Fuad Editing Zone is the creative powerhouse of Fuad Ahmed, a passionate Graphic Designer and VFX Editor based in Sylhet, Bangladesh. With a journey that began in 2020, I specialize in transforming ideas into stunning visual realities. My expertise lies in creating captivating photo manipulations, click-worthy YouTube thumbnails, and cinematic visual effects that leave a lasting impression. I am dedicated to pushing creative boundaries and delivering high-quality, impactful work for every client."
        },
        portfolio: {
            graphicWorks: [
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
            ] as GraphicWork[],
            animeEdits: [
                { id: 1, url: 'https://www.youtube.com/embed/oAEDU-nycsE', thumbnailUrl: 'https://i.ytimg.com/vi/oAEDU-nycsE/hqdefault.jpg', mostViewed: true },
                { id: 2, url: 'https://www.youtube.com/embed/GiHZJkUvv6o', thumbnailUrl: 'https://i.ytimg.com/vi/GiHZJkUvv6o/hqdefault.jpg', mostViewed: true },
                { id: 3, url: 'https://www.youtube.com/embed/U4ge4NqBFAM', thumbnailUrl: 'https://i.ytimg.com/vi/U4ge4NqBFAM/hqdefault.jpg', mostViewed: true },
                { id: 4, url: 'https://www.youtube.com/embed/F-0ATxAccEI', thumbnailUrl: 'https://i.ytimg.com/vi/F-0ATxAccEI/hqdefault.jpg' },
                { id: 5, url: 'https://www.youtube.com/embed/4YWUaCQkUL0', thumbnailUrl: 'https://i.ytimg.com/vi/4YWUaCQkUL0/hqdefault.jpg' },
                { id: 6, url: 'https://www.youtube.com/embed/w9mP_wz1NXE', thumbnailUrl: 'https://i.ytimg.com/vi/w9mP_wz1NXE/hqdefault.jpg' },
            ] as VideoWork[],
            vfxEdits: [
                { id: 101, url: 'https://www.dropbox.com/scl/fi/04puij825k7seih7pwisl/ssstik.io_-fuadeditingzone_1761101162365-1.mp4?rlkey=bczd8sb8sze95e8qurmuzc4fc&st=ij88s4rk&dl=1' },
                { id: 102, url: 'https://www.dropbox.com/scl/fi/3jkir989bp56zlg2k9uie/ssstik.io_-fuadeditingzone_1761100951741-1.mp4?rlkey=cognu1404zbja0ss0gch3qo6z&st=affhs17t&dl=1' },
                { id: 103, url: 'https://www.dropbox.com/scl/fi/13kcdh2keugsqmvzb4d4c/ssstik.io_-fuadeditingzone_1761101016859-1.mp4?rlkey=322uz9xfq95xqgjb9mmt3uf9w&st=cnx9jk9s&dl=1' },
                { id: 104, url: 'https://www.dropbox.com/scl/fi/wypkzvekmup83x8orz31r/ssstik.io_-fuadeditingzone_1761101128509-1.mp4?rlkey=xlhgik6jc0y3ph2lrrr01ue80&st=7f2ed8vu&dl=1' },
                { id: 105, url: 'https://www.dropbox.com/scl/fi/zk5q1eehoyhawicr4gb6a/ssstik.io_-fuadeditingzone_1761139677511.mp4?rlkey=vkh5egltt3rn5ff7mv45ddxwr&st=g4n8oz1w&dl=1' },
            ] as VideoWork[],
        },
        services: {
            all: [
                { name: 'Photo Manipulation/Social Media', description: 'Creative photo edits and compelling social media post designs to grab attention and boost engagement.', category: 'Graphic Design', isMain: true, hasBadge: true, icon: PhotoManipulationIcon },
                { name: 'YouTube Thumbnails', description: 'Click-worthy and high-quality thumbnails designed to maximize your video views and channel growth.', category: 'Graphic Design', isMain: true, hasBadge: true, icon: ThumbnailIcon },
                { name: 'VFX', description: 'High-end cinematic visual effects and motion graphics that bring fantastical concepts to life.', category: 'Video Editing', isMain: true, hasBadge: true, icon: VfxIcon },
                { name: 'Banner Designs', description: 'Professional banners for social media profiles, websites, and online advertising campaigns.', category: 'Graphic Design', hasBadge: true, icon: BannerIcon },
                { name: 'Logo Design & Branding', description: 'Complete branding packages including logo design, color palettes, and style guides to build a strong brand identity.', category: 'Graphic Design', icon: LogoIcon },
                { name: 'Stream Packages', description: 'Custom overlays, alerts, and graphics for streamers on platforms like Twitch and YouTube.', category: 'Graphic Design', icon: StreamPackageIcon },
                { name: 'Reels Editing', description: 'Engaging and trendy short-form video editing for Instagram Reels, TikTok, and YouTube Shorts.', category: 'Video Editing', hasBadge: true, icon: ReelsIcon },
                { name: 'Intros & Outros', description: 'Professional animated intros and outros to give your video content a polished look.', category: 'Video Editing', icon: IntroOutroIcon },
                { name: 'Color Grading', description: 'Cinematic color correction and grading to enhance the mood and visual appeal of your footage.', category: 'Video Editing', icon: ColorGradingIcon },
            ] as Service[],
        },
    },
    // Feature Flags
    features: {
        marketplace: {
            enabled: false,
        },
    },
    // Audio Configuration
    audio: {
        sources: {
            background: { src: 'https://www.dropbox.com/scl/fi/qw3lpt5irp4wzou3x68ij/space-atmospheric-background-124841.mp3?rlkey=roripitcuro099uar0kabwbb9&dl=1', volume: 0.15, loop: true },
            hover: { src: 'https://www.dropbox.com/scl/fi/n97lcyw8wizmd52xqzvk6/ui-sounds-pack-4-12-359738-1.mp3?rlkey=hsc3o5r8njrivygvn4wqw5fwi&dl=1', volume: 1, loop: false },
            click: { src: 'https://www.dropbox.com/scl/fi/kyhefzv1f8qbnax334rf5/anime-46068.mp3?rlkey=0mppg01wlork4wuk9d9yz23y3&dl=1', volume: 0.4, loop: false },
            profileClick: { src: 'https://www.dropbox.com/scl/fi/bik802kmtwh60iqo6kwwj/sample_hover_subtle02_kofi_by_miraclei-364170.mp3?rlkey=i9k7olqzqhud63fmha7ilxjlu&dl=1', volume: 1, loop: false },
            navClick: { src: 'https://www.dropbox.com/scl/fi/ldbwrq2lowpvcr7p85bar/deep-and-cinematic-woosh-sound-effect-318325.mp3?rlkey=d9sld3dksm4d4859ij8i7cgbd&dl=1', volume: 0.25, loop: false },
            imageHover1: { src: 'https://www.dropbox.com/scl/fi/218n6slrzgy0hka3mhead/ui-sounds-pack-4-12-359738.mp3?rlkey=k9dvvo3sekx5mxj9gli27nmeo&dl=1', volume: 0.4, loop: false },
            imageHover2: { src: 'https://www.dropbox.com/scl/fi/nwskelkksaqzp5pw1ov6s/ui-sounds-pack-5-14-359755.mp3?rlkey=aarm0y1cmotx2yek37o6mkzoi&dl=1', volume: 0.4, loop: false },
            mouseMove: { src: 'https://www.dropbox.com/scl/fi/eyhzvfq43cgzydnr1p16z/swoosh-016-383771.mp3?rlkey=ue4q0kt7rsmyxuiz6kwefsebw&dl=1', volume: 0.2, loop: false },
            storm: { src: 'https://www.dropbox.com/scl/fi/9q8t5vi7a81a4m8nb32gb/sounds-of-a-storm-with-wind-and-thunder-375923.mp3?rlkey=sqdjlw8dwilbg7zlwar1o5n7l&dl=1', volume: 0.6, loop: false },
            welcomeExit: { src: 'https://www.dropbox.com/scl/fi/cosps94ob7q539morzdo9/ui-sounds-pack-2-sound-5-358890.mp3?rlkey=co0gvw2403tc2ws0dhg9eavbr&st=y564seth&dl=1', volume: 0.5, loop: false },
        },
        profileCreationSound: 'https://www.dropbox.com/scl/fi/78emjppfcksgj0yhok7q9/sfx-hi-tech-user-interface-sound-effects-335625.mp3?rlkey=gzzcnclho2bjj309egfgwhmr0&st=pp7s7qe0&dl=1',
    },
    // Firebase Configuration
    firebase: {
        apiKey: "AIzaSyCA_nAtmaN9Bs7a5q-c9za5eSMnk0Ys5Xs",
        authDomain: "fuad-editing-zone.firebaseapp.com",
        projectId: "fuad-editing-zone",
        storageBucket: "fuad-editing-zone.appspot.com",
        messagingSenderId: "832389657221",
        appId: "1:832389657221:web:8a85d5dda0803770376fec",
        measurementId: "G-ZCKW4GPDLT"
    },
};