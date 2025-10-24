import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import type { User } from '../types';

interface UserContextType {
    currentUser: User | null;
    isLocked: boolean;
    register: (userData: User) => User | null;
    logout: () => void;
    lockSite: () => void;
    isUsernameTaken: (username: string) => boolean;
    findUsers: (query: string) => User[];
    getUserByUsername: (username: string) => User | undefined;
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

    const isUsernameTaken = useCallback((username: string) => {
        return !!users[username.toLowerCase()];
    }, [users]);

    const register = useCallback((userData: User): User | null => {
        const usernameLower = userData.username.toLowerCase();
        if (isUsernameTaken(usernameLower)) {
            return null;
        }
        const updatedUsers = { ...users, [usernameLower]: userData };
        setUsers(updatedUsers);
        setCurrentUser(userData);
        persistUsers(updatedUsers);
        persistCurrentUser(userData);
        setIsLocked(false);
        return userData;
    }, [users, isUsernameTaken]);

    const logout = useCallback(() => {
        setCurrentUser(null);
        persistCurrentUser(null);
    }, []);

    const lockSite = useCallback(() => {
        if (!currentUser) {
            setIsLocked(true);
        }
    }, [currentUser]);

    const findUsers = useCallback((query: string) => {
        if (!query) return [];
        const queryLower = query.toLowerCase();
        return Object.values(users).filter((user: User) => 
            user.username.toLowerCase().includes(queryLower) ||
            user.name.toLowerCase().includes(queryLower)
        );
    }, [users]);

    const getUserByUsername = useCallback((username: string) => {
        return users[username.toLowerCase()];
    }, [users]);

    const value = useMemo(() => ({
        currentUser,
        isLocked: isInitialized && isLocked && !currentUser,
        register,
        logout,
        lockSite,
        isUsernameTaken,
        findUsers,
        getUserByUsername
    }), [currentUser, isLocked, register, logout, lockSite, isUsernameTaken, findUsers, getUserByUsername, isInitialized]);

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