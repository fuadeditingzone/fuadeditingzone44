import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import type { Post, Job, Submission } from '../types';

interface MarketplaceContextType {
    posts: Post[];
    jobs: Job[];
    submissions: Submission[];
    addPost: (post: Omit<Post, 'id' | 'views' | 'createdAt'>) => void;
    addJob: (job: Omit<Job, 'id' | 'createdAt' | 'status' | 'hiredDesignerUsername'>) => void;
    addSubmission: (submission: Omit<Submission, 'id' | 'submittedAt'>) => boolean;
    getPostsByUsername: (username: string) => Post[];
    getJobsByClientUsername: (username: string) => Job[];
    getJobById: (jobId: string) => Job | undefined;
    getSubmissionsForJob: (jobId: string) => Submission[];
    incrementPostView: (postId: string) => void;
    hireDesignerForJob: (jobId: string, designerUsername: string) => void;
    hasSubmitted: (jobId: string, username: string) => boolean;
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

const POSTS_DB_KEY = 'portfolioPostsDatabase';
const JOBS_DB_KEY = 'portfolioJobsDatabase';
const SUBMISSIONS_DB_KEY = 'portfolioSubmissionsDatabase';

export const MarketplaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);

    useEffect(() => {
        try {
            const storedPosts = localStorage.getItem(POSTS_DB_KEY);
            const storedJobs = localStorage.getItem(JOBS_DB_KEY);
            const storedSubmissions = localStorage.getItem(SUBMISSIONS_DB_KEY);

            if (storedPosts) setPosts(JSON.parse(storedPosts));
            if (storedJobs) setJobs(JSON.parse(storedJobs));
            if (storedSubmissions) setSubmissions(JSON.parse(storedSubmissions));
        } catch (error) {
            console.error("Failed to load marketplace data from localStorage:", error);
        }
    }, []);

    const persistData = (key: string, data: any) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error(`Failed to save ${key} to localStorage:`, error);
        }
    };

    const addPost = useCallback((postData: Omit<Post, 'id' | 'views' | 'createdAt'>) => {
        const newPost: Post = {
            ...postData,
            id: `post_${Date.now()}_${Math.random()}`,
            views: 0,
            createdAt: Date.now(),
        };
        setPosts(prev => {
            const updated = [...prev, newPost];
            persistData(POSTS_DB_KEY, updated);
            return updated;
        });
    }, []);

    const addJob = useCallback((jobData: Omit<Job, 'id' | 'createdAt' | 'status' | 'hiredDesignerUsername'>) => {
        const newJob: Job = {
            ...jobData,
            id: `job_${Date.now()}_${Math.random()}`,
            createdAt: Date.now(),
            status: 'open',
        };
        setJobs(prev => {
            const updated = [newJob, ...prev];
            persistData(JOBS_DB_KEY, updated);
            return updated;
        });
    }, []);

    const addSubmission = useCallback((submissionData: Omit<Submission, 'id' | 'submittedAt'>) => {
        const hasAlreadySubmitted = submissions.some(s => s.jobId === submissionData.jobId && s.designerUsername === submissionData.designerUsername);
        if (hasAlreadySubmitted) {
            return false;
        }
        const newSubmission: Submission = {
            ...submissionData,
            id: `sub_${Date.now()}_${Math.random()}`,
            submittedAt: Date.now(),
        };
        setSubmissions(prev => {
            const updated = [...prev, newSubmission];
            persistData(SUBMISSIONS_DB_KEY, updated);
            return updated;
        });
        return true;
    }, [submissions]);

    const getPostsByUsername = useCallback((username: string) => {
        return posts.filter(p => p.authorUsername === username).sort((a, b) => b.createdAt - a.createdAt);
    }, [posts]);

    const getJobsByClientUsername = useCallback((username: string) => {
        return jobs.filter(j => j.clientUsername === username).sort((a, b) => b.createdAt - a.createdAt);
    }, [jobs]);

    const getJobById = useCallback((jobId: string) => {
        return jobs.find(j => j.id === jobId);
    }, [jobs]);

    const getSubmissionsForJob = useCallback((jobId: string) => {
        return submissions.filter(s => s.jobId === jobId).sort((a, b) => b.submittedAt - a.submittedAt);
    }, [submissions]);

    const incrementPostView = useCallback((postId: string) => {
        setPosts(prev => {
            const updated = prev.map(p => p.id === postId ? { ...p, views: p.views + 1 } : p);
            // Do not persist immediately to avoid spamming localStorage on every view
            return updated;
        });
    }, []);
    
    const hireDesignerForJob = useCallback((jobId: string, designerUsername: string) => {
        setJobs(prev => {
            const updated = prev.map(j => j.id === jobId ? { ...j, status: 'in-progress' as const, hiredDesignerUsername: designerUsername } : j);
            persistData(JOBS_DB_KEY, updated);
            return updated;
        });
    }, []);

    const hasSubmitted = useCallback((jobId: string, username: string) => {
        return submissions.some(s => s.jobId === jobId && s.designerUsername === username);
    }, [submissions]);

    const value = useMemo(() => ({
        posts,
        jobs,
        submissions,
        addPost,
        addJob,
        addSubmission,
        getPostsByUsername,
        getJobsByClientUsername,
        getJobById,
        getSubmissionsForJob,
        incrementPostView,
        hireDesignerForJob,
        hasSubmitted,
    }), [posts, jobs, submissions, addPost, addJob, addSubmission, getPostsByUsername, getJobsByClientUsername, getJobById, getSubmissionsForJob, incrementPostView, hireDesignerForJob, hasSubmitted]);

    return (
        <MarketplaceContext.Provider value={value}>
            {children}
        </MarketplaceContext.Provider>
    );
};

export const useMarketplace = (): MarketplaceContextType => {
    const context = useContext(MarketplaceContext);
    if (context === undefined) {
        throw new Error('useMarketplace must be used within a MarketplaceProvider');
    }
    return context;
};