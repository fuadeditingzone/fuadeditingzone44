import React, { createContext, useContext, useMemo } from 'react';
// FIX: Import User type
import type { User } from '../types';

// The User type has been removed, so the context will be simpler.
// This is a placeholder type for the dummy context.
interface UserContextType {
    // FIX: Update currentUser to be User | null
    currentUser: User | null;
    // FIX: Add firebaseUser to the type for LoginModal
    firebaseUser: any;
    loading: boolean;
    isLocked: boolean;
    handleGoogleSignIn: () => Promise<void>;
    // FIX: Update return type for createUserProfile
    createUserProfile: (userData: any, avatarFile?: File) => Promise<User | null>;
    logout: () => Promise<void>;
    lockSite: () => void;
    unlockSite: () => void;
    isUsernameTaken: (username: string, currentUid?: string) => Promise<boolean>;
    findUsers: (query: string) => Promise<any[]>;
    // FIX: Update return type for getUserByUsername
    getUserByUsername: (username: string) => Promise<User | undefined>;
    updateUser: (uid: string, updatedData: any, newAvatarFile?: File) => Promise<boolean>;
    getAllUsers: () => Promise<any[]>;
}


const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    
    // All Firebase logic has been removed. This provider now gives a static, "logged-out" context.
    const value = useMemo(() => ({
        currentUser: null,
        // FIX: Add firebaseUser to the value
        firebaseUser: null,
        loading: false,
        isLocked: false,
        handleGoogleSignIn: async () => { console.log("Login functionality has been removed."); },
        createUserProfile: async () => { console.log("Login functionality has been removed."); return null; },
        logout: async () => { console.log("Login functionality has been removed."); },
        lockSite: () => {},
        unlockSite: () => {},
        isUsernameTaken: async () => false,
        findUsers: async () => [],
        getUserByUsername: async () => undefined,
        updateUser: async () => false,
        getAllUsers: async () => [],
    }), []);

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = (): UserContextType => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
