import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import type { User } from '../types';

interface UserContextType {
    currentUser: User | null;
    isLocked: boolean;
    register: (userData: Omit<User, 'profileLastUpdatedAt' | 'usernameLastUpdatedAt'>) => User | null;
    updateUser: (updatedData: Partial<User>) => boolean;
    logout: () => void;
    lockSite: () => void;
    isUsernameTaken: (username: string, currentUsername?: string) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_DB_KEY = 'portfolioUserDatabase';
const CURRENT_USER_KEY = 'portfolioCurrentUser';

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [users, setUsers] = useState<Record<string, User>>({});
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        try {
            const storedUsers = localStorage.getItem(USER_DB_KEY);
            const storedCurrentUser = localStorage.getItem(CURRENT_USER_KEY);
            
            if (storedUsers) {
                setUsers(JSON.parse(storedUsers));
            }
            if (storedCurrentUser) {
                setCurrentUser(JSON.parse(storedCurrentUser));
            }
        } catch (error) {
            console.error("Failed to load user data from local storage:", error);
        }
        setIsInitialized(true);
    }, []);

    const persistUsers = (updatedUsers: Record<string, User>) => {
        try {
            localStorage.setItem(USER_DB_KEY, JSON.stringify(updatedUsers));
        } catch (error) {
            console.error("Failed to save user database to local storage:", error);
        }
    };

    const persistCurrentUser = (user: User | null) => {
        try {
            if (user) {
                localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
            } else {
                localStorage.removeItem(CURRENT_USER_KEY);
            }
        } catch (error) {
            console.error("Failed to save current user to local storage:", error);
        }
    }

    const isUsernameTaken = useCallback((username: string, currentUsername?: string) => {
        const usernameLower = username.toLowerCase();
        if (currentUsername && currentUsername.toLowerCase() === usernameLower) {
            return false;
        }
        return !!users[usernameLower];
    }, [users]);

    const register = useCallback((userData: Omit<User, 'profileLastUpdatedAt' | 'usernameLastUpdatedAt'>): User | null => {
        const usernameLower = userData.username.toLowerCase();
        if (isUsernameTaken(usernameLower)) {
            return null;
        }
        const now = Date.now();
        const newUser: User = { ...userData, profileLastUpdatedAt: now, usernameLastUpdatedAt: now };
        const updatedUsers = { ...users, [usernameLower]: newUser };
        
        setUsers(updatedUsers);
        setCurrentUser(newUser);
        persistUsers(updatedUsers);
        persistCurrentUser(newUser);
        setIsLocked(false);
        return newUser;
    }, [users, isUsernameTaken]);

    const updateUser = useCallback((updatedData: Partial<User>): boolean => {
        if (!currentUser) return false;

        const oldUsernameLower = currentUser.username.toLowerCase();
        const newUsernameLower = updatedData.username ? updatedData.username.toLowerCase() : oldUsernameLower;

        const updatedUser: User = { ...currentUser, ...updatedData };
        if (updatedData.username) {
            updatedUser.usernameLastUpdatedAt = Date.now();
        }
        if (updatedData.name || updatedData.profession || updatedData.bio || updatedData.role) {
            updatedUser.profileLastUpdatedAt = Date.now();
        }
        
        const updatedUsers = { ...users };
        // If username changed, update the key in the database
        if (oldUsernameLower !== newUsernameLower) {
            delete updatedUsers[oldUsernameLower];
        }
        updatedUsers[newUsernameLower] = updatedUser;

        setUsers(updatedUsers);
        setCurrentUser(updatedUser);
        persistUsers(updatedUsers);
        persistCurrentUser(updatedUser);
        return true;
    }, [currentUser, users]);

    const logout = useCallback(() => {
        setCurrentUser(null);
        persistCurrentUser(null);
    }, []);

    const lockSite = useCallback(() => {
        if (!currentUser) {
            setIsLocked(true);
        }
    }, [currentUser]);
    
    const value = useMemo(() => ({
        currentUser,
        isLocked: isInitialized && isLocked && !currentUser,
        register,
        updateUser,
        logout,
        lockSite,
        isUsernameTaken,
    }), [currentUser, isLocked, register, updateUser, logout, lockSite, isUsernameTaken, isInitialized]);

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