import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import type { User } from '../types';
import { auth, db, storage, firebaseInitialized } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface UserContextType {
    currentUser: User | null;
    isAuthLoading: boolean;
    isProfileCreationRequired: boolean;
    login: () => void;
    logout: () => void;
    register: (profileData: Omit<User, 'uid' | 'email' | 'photoURL'>, photoFile?: File) => Promise<User | null>;
    updateUser: (updatedData: Partial<User>) => Promise<boolean>;
    isUsernameTaken: (username: string) => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isProfileCreationRequired, setIsProfileCreationRequired] = useState(false);

    const checkUserProfile = useCallback(async (user: FirebaseUser) => {
        if (!db) return;
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            setCurrentUser(docSnap.data() as User);
            setIsProfileCreationRequired(false);
        } else {
            setCurrentUser(null);
            setIsProfileCreationRequired(true);
        }
    }, []);

    useEffect(() => {
        if (!firebaseInitialized || !auth) {
            setIsAuthLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setFirebaseUser(user);
                await checkUserProfile(user);
            } else {
                setFirebaseUser(null);
                setCurrentUser(null);
                setIsProfileCreationRequired(false);
            }
            setIsAuthLoading(false);
        });

        return () => unsubscribe();
    }, [checkUserProfile]);

    const login = useCallback(async () => {
        if (!auth) return;
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            // onAuthStateChanged will handle the successful login
        } catch (error) {
            console.error("Error during Google sign-in:", error);
            // Handle specific errors like popup blocked by browser
        }
    }, []);

    const logout = useCallback(async () => {
        if (!auth) return;
        try {
            await signOut(auth);
            setCurrentUser(null);
            setFirebaseUser(null);
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    }, []);

    const isUsernameTaken = useCallback(async (username: string): Promise<boolean> => {
        if (!db) return false;
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", username.toLowerCase()));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    }, []);
    
    const register = useCallback(async (profileData: Omit<User, 'uid'|'email'|'photoURL'>, photoFile?: File): Promise<User | null> => {
        if (!db || !firebaseUser) return null;

        let photoURL = firebaseUser.photoURL || '';
        if (photoFile && storage) {
            const storageRef = ref(storage, `profile-pictures/${firebaseUser.uid}`);
            await uploadBytes(storageRef, photoFile);
            photoURL = await getDownloadURL(storageRef);
        }

        const now = Date.now();
        const newUser: User = {
            ...profileData,
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            photoURL: photoURL,
            username: profileData.username.toLowerCase(),
            profileLastUpdatedAt: now,
            usernameLastUpdatedAt: now,
        };

        try {
            await setDoc(doc(db, "users", firebaseUser.uid), newUser);
            setCurrentUser(newUser);
            setIsProfileCreationRequired(false);
            return newUser;
        } catch (error) {
            console.error("Error creating profile:", error);
            return null;
        }
    }, [firebaseUser]);

    const updateUser = useCallback(async (updatedData: Partial<User>): Promise<boolean> => {
        if (!db || !currentUser) return false;
        
        const userRef = doc(db, "users", currentUser.uid);
        
        try {
            await updateDoc(userRef, updatedData);
            setCurrentUser(prev => prev ? { ...prev, ...updatedData } : null);
            return true;
        } catch (error) {
            console.error("Error updating profile:", error);
            return false;
        }
    }, [currentUser]);

    const value = useMemo(() => ({
        currentUser,
        isAuthLoading,
        isProfileCreationRequired,
        login,
        logout,
        register,
        updateUser,
        isUsernameTaken,
    }), [currentUser, isAuthLoading, isProfileCreationRequired, login, logout, register, updateUser, isUsernameTaken]);

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