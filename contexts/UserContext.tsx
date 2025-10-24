import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import type { User } from '../types';

interface UserContextType {
    user: User | null;
    isLocked: boolean;
    login: (userData: User) => void;
    logout: () => void;
    lockSite: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('portfolioUser');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Failed to load user from local storage:", error);
        }
        setIsInitialized(true);
    }, []);

    const login = useCallback((userData: User) => {
        try {
            localStorage.setItem('portfolioUser', JSON.stringify(userData));
            setUser(userData);
            setIsLocked(false);
        } catch (error) {
            console.error("Failed to save user to local storage:", error);
        }
    }, []);

    const logout = useCallback(() => {
        try {
            localStorage.removeItem('portfolioUser');
            setUser(null);
        } catch (error) {
            console.error("Failed to remove user from local storage:", error);
        }
    }, []);

    const lockSite = useCallback(() => {
        // Only lock if the user is not logged in
        if (!user) {
            setIsLocked(true);
        }
    }, [user]);

    const value = useMemo(() => ({
        user,
        isLocked: isInitialized && isLocked, // Only be locked after initialization
        login,
        logout,
        lockSite
    }), [user, isLocked, login, logout, lockSite, isInitialized]);

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
