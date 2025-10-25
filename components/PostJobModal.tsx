import React, { useState, useEffect } from 'react';
import type { Job } from '../types';
import { useMarketplace } from '../contexts/MarketplaceContext';
import { useUser } from '../contexts/UserContext';
import { CloseIcon } from './Icons';

interface PostJobModalProps {
    onClose: () => void;
}

const deadlines = ["1 Week", "2 Weeks", "1 Month", "More than 1 Month"];
const currencies = ["USD", "EUR", "GBP", "BDT"];

export const PostJobModal: React.FC<PostJobModalProps> = ({ onClose }) => {
    const { currentUser } = useUser();
    const { addJob } = useMarketplace();
    const [formData, setFormData] = useState<Omit<Job, 'id' | 'createdAt' | 'status' | 'hiredDesignerUsername' | 'clientUsername' | 'clientName' | 'clientAvatarUrl'>>({
        title: '',
        description: '',
        budget: 0,
        currency: 'USD',
        deadline: '1 Week',
    });
    const [error, setError] = useState('');

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'budget' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || currentUser.role !== 'client') {
            setError('Only clients can post jobs.');
            return;
        }
        if (!formData.title.trim() || !formData.description.trim() || formData.budget <= 0) {
            setError('Please fill out all fields and set a valid budget.');
            return;
        }

        addJob({
            ...formData,
            clientUsername: currentUser.username,
            clientName: currentUser.name,
            clientAvatarUrl: currentUser.avatarUrl,
        });
        onClose();
    };


    return (
        <div className="fixed inset-0 bg-black/90 z-[80] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-gray-900/80 border border-gray-700 rounded-2xl w-full max-w-2xl flex flex-col max-h-[90vh]" style={{ animation: 'fade-in-scale 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-gray-700/50 flex-shrink-0">
                    <h2 className="text-2xl font-bold font-poppins text-white">Post a New Job</h2>
                    <button onClick={onClose} aria-label="Close post job form" className="text-white/70 hover:text-white transition-colors p-2 rounded-full bg-black/50 hover:bg-[#e50914]">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Job Title</label>
                        <input id="title" name="title" type="text" required value={formData.title} onChange={handleChange} className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all" placeholder="e.g., Cinematic VFX for a Short Film"/>
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Job Description</label>
                        <textarea id="description" name="description" required value={formData.description} onChange={handleChange} rows={5} className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all" placeholder="Describe the project in detail..."/>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="budget" className="block text-sm font-medium text-gray-300 mb-1">Budget</label>
                            <input id="budget" name="budget" type="number" required value={formData.budget || ''} onChange={handleChange} min="1" className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all" placeholder="500"/>
                        </div>
                         <div>
                            <label htmlFor="currency" className="block text-sm font-medium text-gray-300 mb-1">Currency</label>
                            <select id="currency" name="currency" value={formData.currency} onChange={handleChange} className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all">
                                {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="deadline" className="block text-sm font-medium text-gray-300 mb-1">Delivery Time</label>
                            <select id="deadline" name="deadline" value={formData.deadline} onChange={handleChange} className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all">
                                {deadlines.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    <div className="pt-4">
                        <button type="submit" className="w-full btn-glow bg-red-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 hover:bg-red-700 transform hover:scale-105">Post Job</button>
                    </div>
                </form>
            </div>
        </div>
    );
};