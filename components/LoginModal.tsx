import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import type { User } from '../types';
import { LOGO_URL } from '../constants';
import { StreamPackageIcon, ChatBubbleIcon, VfxIcon } from './Icons';

// Simple inline SVG icons for benefits list
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

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, onRegisterSuccess }) => {
    const { register, isUsernameTaken } = useUser();
    const [formData, setFormData] = useState<Omit<User, 'bio'>>({
        username: '', name: '', profession: '', role: 'client',
    });
    const [bio, setBio] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'username') { setFormData({ ...formData, [name]: value.replace(/\s/g, '').toLowerCase() }); } 
        else if (name === 'bio') { setBio(value); } 
        else { setFormData({ ...formData, [name]: value }); }
    };

    const handleProfessionTagClick = (profession: string) => {
        setFormData({ ...formData, profession });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.username.trim() || !formData.name.trim() || !formData.profession.trim()) { setError('Please fill in all required fields.'); return; }
        if (isUsernameTaken(formData.username)) { setError('This username is already taken. Please choose another.'); return; }
        setError('');
        const newUser = register({ ...formData, bio });
        if (newUser) {
            onRegisterSuccess(newUser);
            onClose();
        } else {
            setError('An unexpected error occurred. Please try again.');
        }
    };

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="perspective w-full max-w-4xl" onClick={e => e.stopPropagation()}>
                <div className="relative bg-gray-900/80 backdrop-blur-lg border border-red-500/30 rounded-2xl shadow-2xl shadow-red-500/20 transform-style-3d animate-flip-in-3d flex flex-col md:flex-row overflow-hidden">
                    {/* Benefits Panel */}
                    <div className="w-full md:w-2/5 bg-black/30 p-8 flex flex-col justify-center">
                        <img src={LOGO_URL} alt="Logo" className="w-16 h-16 mb-6" />
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
                    <div className="w-full md:w-3/5 p-8">
                        <h2 className="text-2xl font-bold text-white mb-2 text-center md:text-left">Create your Profile</h2>
                        <p className="text-gray-400 mb-6 text-center md:text-left">It's free and only takes a minute.</p>
                        <form onSubmit={handleSubmit} className="space-y-4 text-left">
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
                            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                            <button type="submit" className="w-full btn-glow bg-red-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 hover:bg-red-700 transform hover:scale-105 mt-2">Create Profile</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};