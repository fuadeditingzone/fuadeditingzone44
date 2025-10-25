import React, { useEffect, useState } from 'react';
import type { Job, Submission, Post } from '../types';
import { useMarketplace } from '../contexts/MarketplaceContext';
import { useUser } from '../contexts/UserContext';
import { CloseIcon, CurrencyDollarIcon, ClockIcon, PlayIcon, CheckCircleIcon, ExclamationTriangleIcon } from './Icons';

interface JobDetailsModalProps {
    job: Job;
    onClose: () => void;
    onViewProfile: (username: string) => void;
}

const SubmissionCard: React.FC<{ submission: Submission; isOwner: boolean; jobStatus: Job['status']; hiredDesigner?: string; onHire: () => void; onViewProfile: (username: string) => void; }> = ({ submission, isOwner, jobStatus, hiredDesigner, onHire, onViewProfile }) => {
    const isHired = hiredDesigner === submission.designerUsername;
    const canHire = isOwner && jobStatus === 'open';

    return (
        <div className={`relative p-4 bg-gray-800/50 border rounded-lg transition-all duration-300 ${isHired ? 'border-green-500' : 'border-gray-700'}`}>
            <div className="relative aspect-video rounded-md overflow-hidden mb-3">
                <img src={submission.post.type === 'image' ? submission.post.mediaUrl : submission.post.thumbnailUrl} alt={submission.post.title} className="w-full h-full object-cover"/>
                {submission.post.type === 'video' && <div className="absolute inset-0 flex items-center justify-center bg-black/40"><PlayIcon className="w-8 h-8 text-white"/></div>}
            </div>
            <h4 className="font-semibold text-white truncate">{submission.post.title}</h4>
            <button onClick={() => onViewProfile(submission.designerUsername)} className="text-sm text-gray-400 hover:text-red-400 transition-colors flex items-center gap-2 mt-1">
                {submission.designerAvatarUrl ? <img src={submission.designerAvatarUrl} className="w-5 h-5 rounded-full object-cover"/> : <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-xs">{submission.designerName.charAt(0)}</div>}
                {submission.designerName}
            </button>
            {isOwner && (
                 <div className="mt-4">
                    {jobStatus === 'open' && (
                        <button onClick={onHire} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition-all transform hover:scale-105 btn-glow">
                            Hire Designer
                        </button>
                    )}
                    {jobStatus !== 'open' && isHired && (
                        <div className="flex items-center justify-center gap-2 text-green-400 font-bold py-2 bg-green-500/10 rounded-lg">
                            <CheckCircleIcon className="w-5 h-5"/> <span>Hired</span>
                        </div>
                    )}
                     {jobStatus !== 'open' && !isHired && (
                        <div className="text-center text-gray-500 font-bold py-2 bg-gray-700/50 rounded-lg">
                            Unavailable
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const SubmitWorkSelector: React.FC<{ posts: Post[], onSelect: (post: Post) => void }> = ({ posts, onSelect }) => (
    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
        {posts.map(post => (
            <button key={post.id} onClick={() => onSelect(post)} className="w-full flex items-center gap-3 p-2 bg-gray-800 hover:bg-red-500/20 border border-gray-700 hover:border-red-500/50 rounded-lg transition-all">
                <img src={post.type === 'image' ? post.mediaUrl : post.thumbnailUrl} alt={post.title} className="w-16 h-10 object-cover rounded-md flex-shrink-0" />
                <span className="text-white text-left truncate">{post.title}</span>
            </button>
        ))}
    </div>
);

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({ job, onClose, onViewProfile }) => {
    const { currentUser } = useUser();
    const { submissions, getSubmissionsForJob, getPostsByUsername, addSubmission, hireDesignerForJob, hasSubmitted } = useMarketplace();
    const [jobSubmissions, setJobSubmissions] = useState<Submission[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [designerPosts, setDesignerPosts] = useState<Post[]>([]);
    const [showHireWarning, setShowHireWarning] = useState<string | null>(null);

    const isOwner = currentUser?.username === job.clientUsername;
    const isDesigner = currentUser?.role === 'designer';
    const hasAlreadySubmitted = currentUser ? hasSubmitted(job.id, currentUser.username) : false;

    useEffect(() => { setJobSubmissions(getSubmissionsForJob(job.id)); }, [submissions, job.id, getSubmissionsForJob]);
    useEffect(() => { if (isDesigner && currentUser) setDesignerPosts(getPostsByUsername(currentUser.username)); }, [isDesigner, currentUser, getPostsByUsername]);
    useEffect(() => { const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, [onClose]);

    const handleSubmission = (post: Post) => {
        if (!currentUser || !isDesigner) return;
        const success = addSubmission({
            jobId: job.id,
            designerUsername: currentUser.username,
            designerName: currentUser.name,
            designerAvatarUrl: currentUser.avatarUrl,
            post: post,
        });
        if(success) setIsSubmitting(false);
    };

    const handleHire = (designerUsername: string) => {
        if (!isOwner) return;
        hireDesignerForJob(job.id, designerUsername);
        setShowHireWarning(null);
    };
    
    return (
        <>
            <div className="fixed inset-0 bg-black/90 z-[80] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
                <div className="bg-gray-900/80 border border-gray-700 rounded-2xl w-full max-w-5xl flex flex-col max-h-[90vh]" style={{ animation: 'fade-in-scale 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }} onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center p-6 border-b border-gray-700/50 flex-shrink-0">
                        <div>
                            <h2 className="text-2xl font-bold font-poppins text-white">{job.title}</h2>
                            <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                                <div className="flex items-center gap-2"><CurrencyDollarIcon className="w-5 h-5 text-green-400"/> {job.budget} {job.currency}</div>
                                <div className="flex items-center gap-2"><ClockIcon className="w-5 h-5 text-yellow-400"/> {job.deadline}</div>
                            </div>
                        </div>
                        <button onClick={onClose} aria-label="Close job details" className="text-white/70 hover:text-white transition-colors p-2 rounded-full bg-black/50 hover:bg-[#e50914]"><CloseIcon className="w-6 h-6" /></button>
                    </div>
                    <div className="flex-grow overflow-y-auto p-6 space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-white mb-2">Project Brief</h3>
                            <p className="text-gray-300 whitespace-pre-wrap">{job.description}</p>
                        </div>
                        
                        {isDesigner && job.status === 'open' && !hasAlreadySubmitted && (
                            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                                {isSubmitting ? (
                                    <>
                                        <h3 className="text-lg font-bold text-white mb-3">Select your work to submit</h3>
                                        {designerPosts.length > 0 ? <SubmitWorkSelector posts={designerPosts} onSelect={handleSubmission}/> : <p className="text-gray-400">You have no posts to submit. Please upload your work first.</p>}
                                        <button onClick={() => setIsSubmitting(false)} className="text-sm text-gray-400 hover:text-white mt-3">Cancel</button>
                                    </>
                                ) : (
                                    <button onClick={() => setIsSubmitting(true)} className="w-full btn-glow bg-red-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 hover:bg-red-700 transform hover:scale-105">Submit Your Work</button>
                                )}
                            </div>
                        )}
                        {hasAlreadySubmitted && <div className="text-center p-3 bg-green-500/10 text-green-400 rounded-lg font-semibold">You have submitted your work for this job.</div>}

                        <div>
                            <h3 className="text-lg font-bold text-white mb-4">Submissions ({jobSubmissions.length})</h3>
                            {jobSubmissions.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {jobSubmissions.map(sub => <SubmissionCard key={sub.id} submission={sub} isOwner={isOwner} jobStatus={job.status} hiredDesigner={job.hiredDesignerUsername} onHire={() => setShowHireWarning(sub.designerUsername)} onViewProfile={onViewProfile} />)}
                                </div>
                            ) : (
                                <p className="text-gray-400">No submissions yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showHireWarning && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowHireWarning(null)}>
                    <div className="bg-gray-900 border border-yellow-500/50 rounded-2xl max-w-md w-full p-8 text-center" onClick={e => e.stopPropagation()}>
                        <ExclamationTriangleIcon className="w-12 h-12 text-yellow-400 mx-auto mb-4"/>
                        <h2 className="text-2xl font-bold text-white mb-3">Confirm Hire</h2>
                        <p className="text-gray-300 mb-6">Are you sure you want to hire this designer? This will lock you into communicating with them for this project, and you won't be able to hire anyone else from this submission pool.</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => setShowHireWarning(null)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">Cancel</button>
                            <button onClick={() => handleHire(showHireWarning)} className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">Confirm & Hire</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};