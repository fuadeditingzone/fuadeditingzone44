import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import type { User } from '../types';
import { LOGO_URL } from '../constants';

export const LoginModal: React.FC = () => {
    const { login } = useUser();
    const [formData, setFormData] = useState<Omit<User, 'bio'>>({
        name: '',
        profession: '',
        role: 'client',
    });
    const [bio, setBio] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.profession.trim()) {
            setError('Please fill in your name and profession.');
            return;
        }
        setError('');
        login({ ...formData, bio });
    };

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="login-title">
             <div className="perspective">
                <div 
                    className="relative bg-gray-900/80 backdrop-blur-lg border border-red-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-red-500/20 text-center transform-style-3d animate-flip-in-3d"
                >
                    <div className="flex flex-col items-center">
                        <img src={LOGO_URL} alt="Logo" className="w-20 h-20 mb-4" />
                        <h2 id="login-title" className="text-2xl font-bold text-white mb-2">Join the Zone</h2>
                        <p className="text-gray-400 mb-6">Log in to personalize your experience and save your chat.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 text-left">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                                placeholder="e.g., Jane Doe"
                            />
                        </div>
                        <div>
                            <label htmlFor="profession" className="block text-sm font-medium text-gray-300 mb-1">Profession</label>
                            <input
                                id="profession"
                                name="profession"
                                type="text"
                                required
                                value={formData.profession}
                                onChange={handleChange}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                                placeholder="e.g., Art Director, Developer"
                            />
                        </div>

                        <div>
                             <label className="block text-sm font-medium text-gray-300 mb-2">I am a...</label>
                             <div className="flex gap-4">
                                <label className="flex-1 flex items-center gap-2 p-3 bg-gray-800 border border-gray-600 rounded-lg cursor-pointer has-[:checked]:border-red-500 has-[:checked]:bg-red-500/10 transition-all">
                                    <input type="radio" name="role" value="client" checked={formData.role === 'client'} onChange={handleChange} className="accent-red-500" />
                                    <span className="text-gray-200">Client</span>
                                </label>
                                <label className="flex-1 flex items-center gap-2 p-3 bg-gray-800 border border-gray-600 rounded-lg cursor-pointer has-[:checked]:border-red-500 has-[:checked]:bg-red-500/10 transition-all">
                                    <input type="radio" name="role" value="designer" checked={formData.role === 'designer'} onChange={handleChange} className="accent-red-500" />
                                    <span className="text-gray-200">Designer / Creative</span>
                                </label>
                             </div>
                        </div>

                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                        
                        <button type="submit" className="w-full btn-glow bg-red-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 hover:bg-red-700 transform hover:scale-105 mt-2">
                            Continue
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
