import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import type { User } from '../types';
import { CloseIcon, CameraIcon } from './Icons';

interface EditProfileModalProps {
    user: User;
    onClose: () => void;
}

const professionTags = ["Graphic Designer", "Video Editor", "Developer", "Content Creator", "Student", "Art Director"];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose }) => {
    const { updateUser, isUsernameTaken } = useUser();
    
    const [formData, setFormData] = useState({
        name: user.name,
        username: user.username,
        profession: user.profession,
        bio: user.bio || '',
        linkedinUrl: user.linkedinUrl || '',
        facebookUrl: user.facebookUrl || '',
        instagramUrl: user.instagramUrl || '',
        behanceUrl: user.behanceUrl || '',
    });
    
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl || null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setError('');
        if (name === 'username') {
            setFormData({ ...formData, [name]: value.replace(/\s/g, '').toLowerCase() });
        } else {
            setFormData({ ...formData, [name]: value });
        }
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (formData.username !== user.username) {
            const usernameExists = await isUsernameTaken(formData.username, user.uid);
            if (usernameExists) {
                setError('This username is already taken.');
                setIsLoading(false);
                return;
            }
        }
        
        const updatedPayload: Partial<User> = { ...formData };
        const success = await updateUser(user.uid, updatedPayload, avatarFile || undefined);
        setIsLoading(false);

        if (success) {
            onClose();
        } else {
            setError('Failed to update profile. Please try again.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="bg-gray-900/80 border border-gray-700 rounded-2xl w-full max-w-2xl flex flex-col max-h-[90vh]"
                style={{ animation: 'fade-in-scale 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-6 border-b border-gray-700/50 flex-shrink-0">
                    <h2 className="text-2xl font-bold font-poppins text-white">Edit Profile</h2>
                    <button onClick={onClose} aria-label="Close edit profile" className="text-white/70 hover:text-white transition-colors p-2 rounded-full bg-black/50 hover:bg-[#e50914]">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-4">
                     <div className="flex justify-center mb-4">
                        <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="relative w-24 h-24 rounded-full bg-gray-800 border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-500 hover:border-red-500 hover:text-red-500 transition-all group overflow-hidden">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                            ) : (
                                <CameraIcon className="w-10 h-10" />
                            )}
                            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-bold">Change</span>
                            </div>
                        </button>
                    </div>
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                        <div className="flex items-center bg-gray-800 border border-gray-600 rounded-lg focus-within:ring-2 focus-within:ring-red-500 transition-all">
                            <span className="text-gray-400 pl-3">@</span>
                            <input id="username" name="username" type="text" required value={formData.username} onChange={handleChange} className="w-full bg-transparent py-2 px-2 text-white focus:outline-none"/>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                        <input id="name" name="name" type="text" required value={formData.name} onChange={handleChange} className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"/>
                    </div>
                    <div>
                        <label htmlFor="profession" className="block text-sm font-medium text-gray-300 mb-1">Profession</label>
                        <input id="profession" name="profession" type="text" required value={formData.profession} onChange={handleChange} className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"/>
                         <div className="flex flex-wrap gap-2 mt-2">
                            {professionTags.map(tag => (
                                <button key={tag} type="button" onClick={() => setFormData(f => ({...f, profession: tag}))} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-md hover:bg-red-500 hover:text-white transition-colors">{tag}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-1">Bio</label>
                        <textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} rows={3} className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Social Links</label>
                        <div className="space-y-3">
                            <input name="linkedinUrl" type="url" value={formData.linkedinUrl} onChange={handleChange} className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all" placeholder="LinkedIn Profile URL"/>
                            <input name="facebookUrl" type="url" value={formData.facebookUrl} onChange={handleChange} className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all" placeholder="Facebook Profile URL"/>
                            <input name="instagramUrl" type="url" value={formData.instagramUrl} onChange={handleChange} className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all" placeholder="Instagram Profile URL"/>
                            <input name="behanceUrl" type="url" value={formData.behanceUrl} onChange={handleChange} className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all" placeholder="Behance Profile URL"/>
                        </div>
                    </div>

                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    <div className="pt-4">
                        <button type="submit" disabled={isLoading} className="w-full btn-glow bg-red-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 hover:bg-red-700 transform hover:scale-105 disabled:opacity-70 disabled:cursor-wait">
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};