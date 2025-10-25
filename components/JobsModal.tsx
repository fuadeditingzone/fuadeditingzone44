import React, { useEffect, useState } from 'react';
import type { Job } from '../types';
import { useMarketplace } from '../contexts/MarketplaceContext';
import { useUser } from '../contexts/UserContext';
import { CloseIcon, CurrencyDollarIcon, ClockIcon } from './Icons';

interface JobsModalProps {
    onClose: () => void;
    onViewJob: (job: Job) => void;
    onPostJobClick: () => void;
}

export const JobsModal: React.FC<JobsModalProps> = ({ onClose, onViewJob, onPostJobClick }) => {
    const { currentUser } = useUser();
    const { jobs } = useMarketplace();
    const [openJobs, setOpenJobs] = useState<Job[]>([]);
    
    useEffect(() => {
        setOpenJobs(jobs.filter(j => j.status === 'open').sort((a,b) => b.createdAt - a.createdAt));
    }, [jobs]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4 sm:p-8 animate-fade-in" onClick={onClose}>
            <div className="bg-gray-900/80 border border-gray-700 rounded-2xl w-full h-full max-w-4xl flex flex-col" style={{ animation: 'fade-in-scale 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-gray-700/50 flex-shrink-0">
                    <h2 className="text-3xl font-bold font-poppins text-white">Job Board</h2>
                    <div className="flex items-center gap-4">
                        {currentUser?.role === 'client' && (
                             <button onClick={onPostJobClick} className="btn-glow bg-red-600 text-white font-bold py-2 px-5 rounded-full transition-all duration-300 hover:bg-red-700 transform hover:scale-105 text-sm">
                                Post a Job
                            </button>
                        )}
                        <button onClick={onClose} aria-label="Close jobs" className="text-white/70 hover:text-white transition-colors p-2 rounded-full bg-black/50 hover:bg-[#e50914]">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto p-6 space-y-4">
                    {openJobs.length > 0 ? (
                        openJobs.map(job => (
                            <button key={job.id} onClick={() => onViewJob(job)} className="w-full text-left p-5 bg-gray-800/50 hover:bg-red-500/10 border border-gray-700 hover:border-red-500/50 rounded-lg transition-all duration-300 block">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            {job.clientAvatarUrl ? <img src={job.clientAvatarUrl} className="w-8 h-8 rounded-full object-cover"/> : <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-sm font-bold">{job.clientName.charAt(0)}</div>}
                                            <span className="text-sm text-gray-400">{job.clientName}</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-white">{job.title}</h3>
                                        <p className="text-gray-400 mt-1 line-clamp-2">{job.description}</p>
                                    </div>
                                    <div className="flex-shrink-0 flex flex-col items-start sm:items-end gap-2 text-sm mt-2 sm:mt-0">
                                        <div className="flex items-center gap-2 text-green-400 font-semibold px-3 py-1 bg-green-500/10 rounded-full">
                                            <CurrencyDollarIcon className="w-5 h-5" />
                                            <span>{job.budget} {job.currency}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-yellow-400 px-3 py-1 bg-yellow-500/10 rounded-full">
                                            <ClockIcon className="w-5 h-5" />
                                            <span>{job.deadline}</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <h3 className="text-2xl font-bold text-white">The Market is Quiet</h3>
                            <p className="text-gray-400 mt-2">No jobs have been posted yet. If you're a client, be the first to find talent!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
