import React, { useState, useMemo } from 'react';
import { useUser } from '../contexts/UserContext';
import type { User } from '../types';

const professionTags = ["Graphic Designer", "Video Editor", "Developer", "Content Creator", "Student", "Art Director"];

const USERNAME_COOLDOWN = 3 * 30 * 24 * 60 * 60 * 1000; // ~3 months in ms
const PROFILE_COOLDOWN = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

const formatTimeLeft = (ms: number) => {
    if (ms <= 0) return "now";
    const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
    if (days > 1) return `${days} days`;
    const hours = Math.ceil(ms / (1000 * 60 * 60));
    return `${hours} hours`;
};

interface EditProfileModalProps {
    onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose }) => {
    const { currentUser, updateUser, isUsernameTaken } = useUser();
    
    const [formData, setFormData] = useState<Omit<User, 'profileLastUpdatedAt' | 'usernameLastUpdatedAt' | 'uid' | 'email' | 'photoURL'>>({
        username: currentUser?.username || '',
        name: currentUser?.name || '',
        profession: currentUser?.profession || '',
        role: currentUser?.role || 'client',
        bio: currentUser?.bio || '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { canUpdateUsername, usernameTimeLeft, canUpdateProfile, profileTimeLeft } = useMemo(() => {
        if (!currentUser) return { canUpdateUsername: false, usernameTimeLeft: 0, canUpdateProfile: false, profileTimeLeft: 0 };
        
        const now = Date.now();
        const usernameCooldownEnd = (currentUser.usernameLastUpdatedAt || 0) + USERNAME_COOLDOWN;
        const profileCooldownEnd = (currentUser.profileLastUpdatedAt || 0) + PROFILE_COOLDOWN;

        return {
            canUpdateUsername: now >= usernameCooldownEnd,
            usernameTimeLeft: usernameCooldownEnd - now,
            canUpdateProfile: now >= profileCooldownEnd,
            profileTimeLeft: profileCooldownEnd - now,
        };
    }, [currentUser]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'username') {
            setFormData({ ...formData, [name]: value.replace(/\s/g, '').toLowerCase() });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        setIsLoading(true);
        
        const hasUsernameChanged = formData.username !== currentUser.username;
        const hasProfileChanged = formData.name !== currentUser.name || formData.profession !== currentUser.profession || formData.bio !== currentUser.bio || formData.role !== currentUser.role;

        if (hasUsernameChanged && !canUpdateUsername) {
            setError(`You can change your username again in ${formatTimeLeft(usernameTimeLeft)}.`);
            setIsLoading(false); return;
        }
        if (hasProfileChanged && !canUpdateProfile) {
            setError(`You can edit your profile again in ${formatTimeLeft(profileTimeLeft)}.`);
            setIsLoading(false); return;
        }
        if (!hasUsernameChanged && !hasProfileChanged) {
            setError("You haven't made any changes.");
            setIsLoading(false); return;
        }
        if (hasUsernameChanged && await isUsernameTaken(formData.username)) {
            setError('This username is already taken. Please choose another.');
            setIsLoading(false); return;
        }

        setError('');
        setSuccess('');

        const updatePayload: Partial<User> = {};
        if (hasUsernameChanged) {
            updatePayload.username = formData.username;
            updatePayload.usernameLastUpdatedAt = Date.now();
        }
        if (hasProfileChanged) {
            updatePayload.name = formData.name;
            updatePayload.profession = formData.profession;
            updatePayload.bio = formData.bio;
            updatePayload.role = formData.role;
            updatePayload.profileLastUpdatedAt = Date.now();
        }
        
        const success = await updateUser(updatePayload);
        setIsLoading(false);
        if (success) {
            setSuccess('Profile updated successfully!');
            setTimeout(onClose, 1500);
        } else {
            setError('An unexpected error occurred. Please try again.');
        }
    };

    if (!currentUser) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="perspective w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="relative bg-gray-900/80 backdrop-blur-lg border border-red-500/30 rounded-2xl shadow-2xl shadow-red-500/20 transform-style-3d animate-flip-in-3d flex flex-col overflow-hidden">
                    <div className="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                        <h2 className="text-2xl font-bold text-white mb-6 text-center">Edit Profile</h2>
                        <form onSubmit={handleSubmit} className="space-y-4 text-left">
                            <div>
                                <label htmlFor="edit-username" className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                                <div className={`flex items-center bg-gray-800 border border-gray-600 rounded-lg transition-all ${!canUpdateUsername ? 'opacity-50' : 'focus-within:ring-2 focus-within:ring-red-500'}`}>
                                    <span className="text-gray-400 pl-3">@</span>
                                    <input id="edit-username" name="username" type="text" required value={formData.username} onChange={handleChange} className="w-full bg-transparent py-2 px-2 text-white focus:outline-none disabled:cursor-not-allowed" placeholder="youruniqueusername" disabled={!canUpdateUsername}/>
                                </div>
                                {!canUpdateUsername && <p className="text-xs text-gray-500 mt-1">You can change this in {formatTimeLeft(usernameTimeLeft)}.</p>}
                            </div>
                            
                            <div className={`${!canUpdateProfile ? 'opacity-50' : ''}`}>
                                <div>
                                    <label htmlFor="edit-name" className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                                    <input id="edit-name" name="name" type="text" required value={formData.name} onChange={handleChange} className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all disabled:cursor-not-allowed" placeholder="e.g., Jane Doe" disabled={!canUpdateProfile} />
                                </div>
                                <div>
                                    <label htmlFor="edit-profession" className="block text-sm font-medium text-gray-300 mb-1 mt-4">Profession</label>
                                    <input id="edit-profession" name="profession" type="text" required value={formData.profession} onChange={handleChange} className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all disabled:cursor-not-allowed" placeholder="e.g., Art Director, Developer" disabled={!canUpdateProfile} />
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {professionTags.map(tag => (
                                            <button key={tag} type="button" onClick={() => setFormData(f => ({ ...f, profession: tag }))} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-md hover:bg-red-500 hover:text-white transition-colors disabled:cursor-not-allowed" disabled={!canUpdateProfile}>{tag}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label htmlFor="edit-bio" className="block text-sm font-medium text-gray-300 mb-1">Bio</label>
                                    <textarea id="edit-bio" name="bio" value={formData.bio} onChange={handleChange} rows={3} className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all disabled:cursor-not-allowed" placeholder="A little about yourself..." disabled={!canUpdateProfile}></textarea>
                                </div>
                                {!canUpdateProfile && <p className="text-xs text-gray-500 mt-1">You can edit these details in {formatTimeLeft(profileTimeLeft)}.</p>}
                            </div>
                            
                            {error && <p className="text-red-400 text-sm text-center pt-2">{error}</p>}
                            {success && <p className="text-green-400 text-sm text-center pt-2">{success}</p>}
                            
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={onClose} className="w-full btn-glow bg-gray-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 hover:bg-gray-700 transform hover:scale-105">Cancel</button>
                                <button type="submit" disabled={isLoading} className="w-full btn-glow bg-red-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 hover:bg-red-700 transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed">{isLoading ? 'Saving...' : 'Save Changes'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};