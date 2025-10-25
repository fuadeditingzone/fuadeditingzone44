import React, { createContext, useContext, useMemo } from 'react';

// All types related to marketplace (Post, Job, Submission) have been removed.
// Using `any` as a placeholder for the now-removed types.
interface MarketplaceContextType {
    posts: any[];
    jobs: any[];
    submissions: any[];
    addPost: (postData: any, mediaDataUrl: string) => Promise<void>;
    addJob: (jobData: any) => Promise<void>;
    addSubmission: (submissionData: any) => Promise<boolean>;
    getPostsByUsername: (username: string) => any[];
    getJobsByClientUsername: (username: string) => any[];
    getJobById: (jobId: string) => undefined;
    getSubmissionsForJob: (jobId: string) => any[];
    incrementPostView: (postId: string) => void;
    hireDesignerForJob: (jobId: string, designerUsername: string) => Promise<void>;
    hasSubmitted: (jobId: string, username: string) => boolean;
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export const MarketplaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // All Firebase logic has been removed. This provider now gives a static, empty context.
    const value = useMemo(() => ({
        posts: [],
        jobs: [],
        submissions: [],
        addPost: async () => { console.log("Marketplace functionality has been removed."); },
        addJob: async () => { console.log("Marketplace functionality has been removed."); },
        addSubmission: async () => { console.log("Marketplace functionality has been removed."); return false; },
        getPostsByUsername: () => [],
        getJobsByClientUsername: () => [],
        getJobById: () => undefined,
        getSubmissionsForJob: () => [],
        incrementPostView: () => {},
        hireDesignerForJob: async () => { console.log("Marketplace functionality has been removed."); },
        hasSubmitted: () => false,
    }), []);

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