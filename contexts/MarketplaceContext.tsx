import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import type { Post, Job, Submission } from '../types';

interface MarketplaceContextType {
    posts: Post[];
    jobs: Job[];
    submissions: Submission[];
    addPost: (postData: Omit<Post, 'id' | 'views' | 'createdAt' | 'mediaUrl'>, mediaDataUrl: string) => Promise<void>;
    addJob: (jobData: Omit<Job, 'id' | 'createdAt' | 'status' | 'hiredDesignerUsername'>) => Promise<void>;
    addSubmission: (submissionData: Omit<Submission, 'id' | 'submittedAt'>) => Promise<boolean>;
    getPostsByUsername: (username: string) => Post[];
    getJobsByClientUsername: (username: string) => Job[];
    getJobById: (jobId: string) => Job | undefined;
    getSubmissionsForJob: (jobId: string) => Submission[];
    incrementPostView: (postId: string) => void;
    hireDesignerForJob: (jobId: string, designerUsername: string) => Promise<void>;
    hasSubmitted: (jobId: string, username: string) => boolean;
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export const MarketplaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);

    const fetchData = useCallback(async () => {
        try {
            const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
            const postsSnapshot = await getDocs(postsQuery);
            setPosts(postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));

            const jobsQuery = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
            const jobsSnapshot = await getDocs(jobsQuery);
            setJobs(jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));

            const submissionsSnapshot = await getDocs(collection(db, 'submissions'));
            setSubmissions(submissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission)));
        } catch (error) {
            console.error("Failed to fetch marketplace data from Firestore:", error);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const addPost = async (postData: Omit<Post, 'id' | 'views' | 'createdAt' | 'mediaUrl'>, mediaDataUrl: string) => {
        const postId = `post_${Date.now()}`;
        const storageRef = ref(storage, `posts/${postId}`);
        const snapshot = await uploadString(storageRef, mediaDataUrl, 'data_url');
        const mediaUrl = await getDownloadURL(snapshot.ref);

        const newPost = {
            ...postData,
            mediaUrl,
            views: 0,
            createdAt: Date.now(),
        };
        
        await addDoc(collection(db, 'posts'), newPost);
        fetchData(); // Refresh data
    };

    const addJob = async (jobData: Omit<Job, 'id' | 'createdAt' | 'status' | 'hiredDesignerUsername'>) => {
        const newJob = {
            ...jobData,
            createdAt: Date.now(),
            status: 'open' as const,
        };
        await addDoc(collection(db, 'jobs'), newJob);
        fetchData();
    };

    const addSubmission = async (submissionData: Omit<Submission, 'id' | 'submittedAt'>): Promise<boolean> => {
        const hasAlreadySubmitted = submissions.some(s => s.jobId === submissionData.jobId && s.designerUsername === submissionData.designerUsername);
        if (hasAlreadySubmitted) return false;
        
        const newSubmission = {
            ...submissionData,
            submittedAt: Date.now(),
        };
        await addDoc(collection(db, 'submissions'), newSubmission);
        fetchData();
        return true;
    };

    const getPostsByUsername = (username: string) => posts.filter(p => p.authorUsername === username);
    const getJobsByClientUsername = (username: string) => jobs.filter(j => j.clientUsername === username);
    const getJobById = (jobId: string) => jobs.find(j => j.id === jobId);
    const getSubmissionsForJob = (jobId: string) => submissions.filter(s => s.jobId === jobId);

    const incrementPostView = async (postId: string) => {
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, { views: increment(1) });
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, views: p.views + 1 } : p));
    };
    
    const hireDesignerForJob = async (jobId: string, designerUsername: string) => {
        const jobRef = doc(db, 'jobs', jobId);
        await updateDoc(jobRef, {
            status: 'in-progress' as const,
            hiredDesignerUsername: designerUsername,
        });
        fetchData();
    };

    const hasSubmitted = (jobId: string, username: string) => submissions.some(s => s.jobId === jobId && s.designerUsername === username);

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
    }), [posts, jobs, submissions]);

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