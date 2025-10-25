import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import type { User } from '../types';
import { siteConfig } from '../config';
import { StreamPackageIcon, ChatBubbleIcon, VfxIcon, GoogleIcon, CloseIcon } from './Icons';

// Simple inline SVG icons for benefits list and form states
const UsersIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m-7.5-2.962A3.75 3.75 0 1 0 9.75 6.75a3.75 3.75 0 0 0-3.75 3.75m0-3.75S6.375 5.25 9.75 5.25m4.5 0s3.375 2.25 3.375 5.25m-5.012 3.785a3.75 3.75 0 1 0-7.48-1.545" />
    </svg>
);
const LockOpenIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m.75-3a3.375 3.375 0 0 1 6.75 0v3.75" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5" />
    </svg>
);

const SpinnerIcon = ({ className }: { className?: string }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const CameraIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
    </svg>
);


const benefits = [
    { icon: StreamPackageIcon, text: "Play background music by command." },
    { icon: UsersIcon, text: "Become visible with a public profile." },
    { icon: ChatBubbleIcon, text: "Talk unlimited with my personal AI." },
    { icon: LockOpenIcon, text: "Get unlimited access to the website." },
    { icon: VfxIcon, text: "Let the AI follow your commands." },
];

const professionTags = ["Graphic Designer", "Video Editor", "Developer", "Content Creator", "Student", "Art Director"];

interface LoginModalProps {
    onClose: () => void;
    onRegisterSuccess: (user: User) => void;
}

type Socials = Pick<User, 'linkedinUrl' | 'facebookUrl' | 'instagramUrl' | 'behanceUrl'>;

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, onRegisterSuccess }) => {
    const { currentUser, firebaseUser, handleGoogleSignIn, createUserProfile, isUsernameTaken } = useUser();
    
    const [step, setStep] = useState<'initial' | 'creating_profile'>('initial');
    const [isLoading, setIsLoading] = useState(false);
    
    const [formData, setFormData] = useState<Omit<User, 'uid' | 'bio' | 'email' | 'avatarUrl' | keyof Socials>>({
        username: '', name: '', profession: '', role: 'client',
    });
    const [socials, setSocials] = useState<Socials>({
        linkedinUrl: '', facebookUrl: '', instagramUrl: '', behanceUrl: ''
    });

    const [bio, setBio] = useState('');
    const [error, setError] = useState('');
    
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (firebaseUser && !currentUser) {
            setFormData(prev => ({ ...prev, name: firebaseUser.displayName || '' }));
            if (firebaseUser.photoURL) {
                fetch(firebaseUser.photoURL)
                    .then(res => res.blob())
                    .then(blob => {
                        const file = new File([blob], "profile.jpg", { type: blob.type });
                        setAvatarFile(file);
                        setAvatarPreview(URL.createObjectURL(blob));
                    })
                    .catch(console.error);
            }
            setStep('creating_profile');
        } else if (currentUser) {
            onClose();
        }
    }, [firebaseUser, currentUser, onClose]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setError('');
        if (name === 'username') { setFormData({ ...formData, [name]: value.replace(/\s/g, '').toLowerCase() }); } 
        else if (name === 'bio') { setBio(value); } 
        else { setFormData({ ...formData, [name]: value }); }
    };
    
    const handleSocialsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSocials(prev => ({ ...prev, [name]: value }));
    };

    const handleProfessionTagClick = (profession: string) => {
        setFormData({ ...formData, profession });
    };
    
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setAvatarPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const onGoogleSignIn = async () => {
        setIsLoading(true);
        setError('');
        try {
            await handleGoogleSignIn();
        } catch (err: any) {
            console.error("Google Sign-In Error:", err);
            if (err.code === 'auth/configuration-not-found') {
                setError('Sign-in provider is not configured. Please enable Google Sign-In in the Firebase console.');
            } else if (err.code === 'auth/popup-closed-by-user') {
                setError('Sign-in cancelled. Please try again.');
            } else {
                setError('An unknown error occurred during sign-in.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firebaseUser) {
            setError('An error occurred. Please try signing in again.');
            return;
        }
        if (!formData.username.trim() || !formData.name.trim() || !formData.profession.trim()) {
            setError('Please fill in all required fields.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const usernameExists = await isUsernameTaken(formData.username);
            if (usernameExists) {
                setError('This username is already taken. Please choose another.');
                return; // Finally block will handle loading state
            }

            const newUserPayload: Omit<User, 'uid' | 'email' | 'avatarUrl'> = {
                ...formData,
                bio,
                ...socials,
            };

            const newUser = await createUserProfile(newUserPayload, avatarFile || undefined);

            if (newUser) {
                onRegisterSuccess(newUser);
                onClose();
            } else {
                setError('Failed to create profile. The email might already be in use or another error occurred.');
            }
        } catch (err) {
            console.error("Profile creation failed:", err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="perspective w-full max-w-4xl" onClick={e => e.stopPropagation()}>
                <div className="relative bg-gray-900/80 backdrop-blur-lg border border-red-500/30 rounded-2xl shadow-2xl shadow-red-500/20 transform-style-3d animate-flip-in-3d flex flex-col md:flex-row overflow-hidden">
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-20"
                        aria-label="Close"
                    >
                        <CloseIcon className="w-6 h-6" />
                    </button>

                    {/* Benefits Panel */}
                    <div className="w-full md:w-2/5 bg-black/30 p-8 flex flex-col justify-center">
                        <img src={siteConfig.branding.logoUrl} alt="Logo" className="w-16 h-16 mb-6" />
                        <h2 id="login-title" className="text-2xl font-bold text-white mb-4">Unlock the Full Experience</h2>
                        <ul className="space-y-4 text-left">
                            {benefits.map((benefit, i) => {
                                const Icon = benefit.icon;
                                return (
                                    <li key={i} className="flex items-center gap-3">
                                        <Icon className="w-6 h-6 text-red-400 flex-shrink-0" />
                                        <span className="text-gray-300">{benefit.text}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    {/* Form Panel */}
                    <div className="w-full md:w-3/5 p-8 flex flex-col justify-center max-h-[90vh] overflow-y-auto">
                        {step === 'initial' && (
                            <div className="text-center">
                                <h2 className="text-3xl font-bold text-white mb-2">Join the Zone</h2>
                                <p className="text-gray-400 mb-6">Sign in to unlock personalized features.</p>
                                {error && <p className="text-red-400 text-sm text-center mb-4 animate-fade-in">{error}</p>}
                                <button
                                    onClick={onGoogleSignIn}
                                    disabled={isLoading}
                                    className="w-full max-w-xs mx-auto btn-glow bg-white text-gray-800 font-bold py-3 px-6 rounded-lg transition-all duration-300 hover:bg-gray-200 transform hover:scale-105 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <SpinnerIcon className="w-6 h-6" />
                                    ) : (
                                        <>
                                            <GoogleIcon className="w-6 h-6" />
                                            <span>Sign in with Google</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {step === 'creating_profile' && firebaseUser && (
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2 text-center md:text-left">Create your Profile</h2>
                                <p className="text-gray-400 mb-4 text-center md:text-left">Signed in as <span className="font-semibold text-gray-300">{firebaseUser.email}</span></p>
                                
                                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                                    <div className="flex justify-center mb-4">
                                        <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                                        <button type="button" onClick={handleAvatarClick} className="relative w-24 h-24 rounded-full bg-gray-800 border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-500 hover:border-red-500 hover:text-red-500 transition-all group overflow-hidden">
                                            {avatarPreview ? (
                                                <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <CameraIcon className="w-10 h-10" />
                                            )}
                                            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-white text-xs font-bold">Upload</span>
                                            </div>
                                        </button>
                                    </div>

                                    <div>
                                        <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                                        <div className="flex items-center bg-gray-800 border border-gray-600 rounded-lg focus-within:ring-2 focus-within:ring-red-500 transition-all">
                                            <span className="text-gray-400 pl-3">@</span>
                                            <input id="username" name="username" type="text" required value={formData.username} onChange={handleChange} className="w-full bg-transparent py-2 px-2 text-white focus:outline-none" placeholder="youruniqueusername"/>
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                                        <input id="name" name="name" type="text" required value={formData.name} onChange={handleChange} className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all" placeholder="e.g., Jane Doe"/>
                                    </div>
                                    <div>
                                        <label htmlFor="profession" className="block text-sm font-medium text-gray-300 mb-1">Profession</label>
                                        <input id="profession" name="profession" type="text" required value={formData.profession} onChange={handleChange} className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all" placeholder="e.g., Art Director, Developer"/>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {professionTags.map(tag => (
                                                <button key={tag} type="button" onClick={() => handleProfessionTagClick(tag)} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-md hover:bg-red-500 hover:text-white transition-colors">{tag}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">I am a...</label>
                                        <div className="flex gap-4">
                                            <label className="flex-1 flex items-center gap-2 p-3 bg-gray-800 border border-gray-600 rounded-lg cursor-pointer has-[:checked]:border-red-500 has-[:checked]:bg-red-500/10 transition-all"><input type="radio" name="role" value="client" checked={formData.role === 'client'} onChange={(e) => setFormData(p => ({...p, role: 'client'}))} className="accent-red-500" /><span className="text-gray-200">Client</span></label>
                                            <label className="flex-1 flex items-center gap-2 p-3 bg-gray-800 border border-gray-600 rounded-lg cursor-pointer has-[:checked]:border-red-500 has-[:checked]:bg-red-500/10 transition-all"><input type="radio" name="role" value="designer" checked={formData.role === 'designer'} onChange={(e) => setFormData(p => ({...p, role: 'designer'}))} className="accent-red-500" /><span className="text-gray-200">Designer</span></label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Social Links (Optional)</label>
                                        <div className="space-y-3">
                                            <input name="linkedinUrl" type="url" value={socials.linkedinUrl} onChange={handleSocialsChange} className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all" placeholder="LinkedIn Profile URL"/>
                                            <input name="facebookUrl" type="url" value={socials.facebookUrl} onChange={handleSocialsChange} className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all" placeholder="Facebook Profile URL"/>
                                            <input name="instagramUrl" type="url" value={socials.instagramUrl} onChange={handleSocialsChange} className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all" placeholder="Instagram Profile URL"/>
                                            <input name="behanceUrl" type="url" value={socials.behanceUrl} onChange={handleSocialsChange} className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all" placeholder="Behance Profile URL"/>
                                        </div>
                                    </div>

                                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                                    <button type="submit" disabled={isLoading} className="w-full btn-glow bg-red-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 hover:bg-red-700 transform hover:scale-105 mt-2 disabled:opacity-70 disabled:cursor-wait">
                                        {isLoading ? <SpinnerIcon className="w-6 h-6 mx-auto" /> : 'Create Profile'}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};