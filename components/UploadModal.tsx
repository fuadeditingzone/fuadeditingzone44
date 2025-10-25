import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Post } from '../types';
import { useMarketplace } from '../contexts/MarketplaceContext';
import { useUser } from '../contexts/UserContext';
import { CloseIcon, UploadIcon } from './Icons';

interface UploadModalProps {
    onClose: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ onClose }) => {
    const { currentUser } = useUser();
    const { addPost } = useMarketplace();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
    const [error, setError] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleFileChange = (file: File | null) => {
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            setError('File is too large. Maximum size is 10MB.');
            return;
        }
        setError('');
        setMediaFile(file);
        setMediaType(file.type.startsWith('image/') ? 'image' : 'video');
        const reader = new FileReader();
        reader.onloadend = () => setMediaPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
        else if (e.type === 'dragleave') setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };
    
    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = tagInput.trim();
            if (newTag && !tags.includes(newTag)) {
                setTags([...tags, newTag]);
            }
            setTagInput('');
        }
    };
    
    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || currentUser.role !== 'designer') { setError('Only designers can upload work.'); return; }
        if (!mediaFile || !mediaType || !mediaPreview) { setError('Please upload an image or video file.'); return; }
        if (!title.trim()) { setError('Please provide a title for your work.'); return; }

        const postData: Omit<Post, 'id' | 'views' | 'createdAt'> = {
            authorUsername: currentUser.username,
            authorName: currentUser.name,
            authorAvatarUrl: currentUser.avatarUrl,
            type: mediaType,
            mediaUrl: mediaPreview, // Storing image as base64
            thumbnailUrl: mediaType === 'video' ? mediaPreview : undefined,
            title,
            description,
            tags,
        };
        addPost(postData);
        onClose();
    };


    return (
        <div className="fixed inset-0 bg-black/90 z-[80] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-gray-900/80 border border-gray-700 rounded-2xl w-full max-w-4xl flex flex-col max-h-[90vh]" style={{ animation: 'fade-in-scale 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-gray-700/50 flex-shrink-0">
                    <h2 className="text-2xl font-bold font-poppins text-white">Upload Your Work</h2>
                    <button onClick={onClose} aria-label="Close upload form" className="text-white/70 hover:text-white transition-colors p-2 rounded-full bg-black/50 hover:bg-[#e50914]"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left: Uploader */}
                    <div className="flex flex-col">
                        <div onDragEnter={handleDragEvents} onDragOver={handleDragEvents} onDragLeave={handleDragEvents} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} className={`relative flex-grow flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-red-500 bg-red-500/10' : 'border-gray-600 hover:border-red-500/50'}`}>
                           <input type="file" ref={fileInputRef} onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)} className="hidden" accept="image/*,video/*" />
                           {mediaPreview ? (
                               mediaType === 'image' ? <img src={mediaPreview} alt="Preview" className="max-h-full max-w-full object-contain rounded-md" /> : <video src={mediaPreview} className="max-h-full max-w-full object-contain rounded-md" />
                           ) : (
                               <div className="text-center text-gray-400">
                                   <UploadIcon className="w-12 h-12 mx-auto" />
                                   <p className="mt-2 font-semibold">Drag & drop files or click to browse</p>
                                   <p className="text-xs">Image or Video (Max 10MB)</p>
                               </div>
                           )}
                        </div>
                    </div>
                    {/* Right: Details Form */}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                            <input id="title" name="title" type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all" placeholder="e.g., Cyberpunk Cityscape"/>
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description (Optional)</label>
                            <textarea id="description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all" placeholder="Tell us about your creation..."/>
                        </div>
                        <div>
                            <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-1">Tags</label>
                            <div className="flex flex-wrap gap-2 p-2 bg-gray-800 border border-gray-600 rounded-lg">
                                {tags.map(tag => (
                                    <div key={tag} className="flex items-center gap-1 bg-red-600/50 text-white text-sm px-2 py-1 rounded">
                                        <span>{tag}</span>
                                        <button type="button" onClick={() => removeTag(tag)} className="font-bold">&times;</button>
                                    </div>
                                ))}
                                <input id="tags" type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} className="flex-1 bg-transparent text-white focus:outline-none" placeholder="Add tags..."/>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Press Enter or comma to add a tag.</p>
                        </div>
                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                        <div className="pt-4">
                            <button type="submit" className="w-full btn-glow bg-red-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 hover:bg-red-700 transform hover:scale-105">Publish</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
