import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { auth, db, storage, database } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, collectionGroup, limit } from 'firebase/firestore';
import { ref as storageRef, uploadString, getDownloadURL, uploadBytes } from 'firebase/storage';
import { ref as databaseRef, set, onValue, serverTimestamp } from 'firebase/database';
import type { User } from '../types';

interface UserContextType {
    currentUser: User | null;
    firebaseUser: FirebaseUser | null;
    loading: boolean;
    isLocked: boolean;
    rtdbName: string | null; // For specific display requirement
    handleGoogleSignIn: () => Promise<void>;
    createUserProfile: (userData: Omit<User, 'uid' | 'email'>, avatarFile?: File) => Promise<User | null>;
    logout: () => Promise<void>;
    lockSite: () => void;
    unlockSite: () => void;
    isUsernameTaken: (username: string, currentUid?: string) => Promise<boolean>;
    findUsers: (query: string) => Promise<User[]>;
    getUserByUsername: (username: string) => Promise<User | undefined>;
    updateUser: (uid: string, updatedData: Partial<User>, newAvatarFile?: File) => Promise<boolean>;
    getAllUsers: () => Promise<User[]>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(auth.currentUser);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [rtdbName, setRtdbName] = useState<string | null>(null);
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setFirebaseUser(user);
            if (user) {
                // Write to Realtime Database
                const userRtdbRef = databaseRef(database, 'users/' + user.uid);
                set(userRtdbRef, {
                    displayName: user.displayName,
                    email: user.email,
                    lastLogin: serverTimestamp()
                }).catch(error => console.error("Error writing user data to RTDB:", error));

                // Listen for name changes from RTDB for display requirement
                const displayNameRtdbRef = databaseRef(database, 'users/' + user.uid + '/displayName');
                onValue(displayNameRtdbRef, (snapshot) => {
                    setRtdbName(snapshot.val());
                });

                // Check Firestore for full app profile
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    setCurrentUser({ uid: user.uid, ...userDocSnap.data() } as User);
                } else {
                    setCurrentUser(null);
                }
            } else {
                setCurrentUser(null);
                setRtdbName(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };
    
    const isUsernameTaken = async (username: string, currentUid?: string): Promise<boolean> => {
        const q = query(collection(db, 'users'), where('username', '==', username.toLowerCase()));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return false;
        if (currentUid && querySnapshot.docs[0].id === currentUid) return false;
        return true;
    };
    
    const createUserProfile = async (userData: Omit<User, 'uid' | 'email'>, avatarFile?: File): Promise<User | null> => {
        if (!firebaseUser) return null;
        try {
            let avatarUrl = undefined;
            if (avatarFile) {
                const sRef = storageRef(storage, `avatars/${firebaseUser.uid}`);
                await uploadBytes(sRef, avatarFile);
                avatarUrl = await getDownloadURL(sRef);
            }
            
            const newUser: User = {
                ...userData,
                uid: firebaseUser.uid,
                email: firebaseUser.email!,
                avatarUrl: avatarUrl || firebaseUser.photoURL || undefined,
            };
            
            await setDoc(doc(db, "users", firebaseUser.uid), {
                username: newUser.username,
                name: newUser.name,
                email: newUser.email,
                profession: newUser.profession,
                role: newUser.role,
                bio: newUser.bio || '',
                avatarUrl: newUser.avatarUrl || '',
                linkedinUrl: newUser.linkedinUrl || '',
                facebookUrl: newUser.facebookUrl || '',
                instagramUrl: newUser.instagramUrl || '',
                behanceUrl: newUser.behanceUrl || '',
            });
            setCurrentUser(newUser);
            return newUser;
        } catch (error) {
            console.error("Error creating user profile:", error);
            return null;
        }
    };
    
    const updateUser = async (uid: string, updatedData: Partial<User>, newAvatarFile?: File): Promise<boolean> => {
        try {
            const userDocRef = doc(db, 'users', uid);
            let finalUpdateData = { ...updatedData };

            if (newAvatarFile) {
                 const sRef = storageRef(storage, `avatars/${uid}`);
                 await uploadBytes(sRef, newAvatarFile);
                 finalUpdateData.avatarUrl = await getDownloadURL(sRef);
            }

            await updateDoc(userDocRef, finalUpdateData);
            
            // Update local state
            setCurrentUser(prev => prev ? { ...prev, ...finalUpdateData } : null);
            return true;
        } catch (error) {
            console.error("Error updating user profile:", error);
            return false;
        }
    };

    const logout = async () => {
        await signOut(auth);
    };

    const lockSite = useCallback(() => { if (!currentUser) setIsLocked(true); }, [currentUser]);
    const unlockSite = useCallback(() => setIsLocked(false), []);

    const findUsers = async (queryText: string): Promise<User[]> => {
        if (!queryText) return [];
        const q = query(collection(db, "users"), where("username", ">=", queryText.toLowerCase()), where("username", "<=", queryText.toLowerCase() + '\uf8ff'), limit(10));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
    };

    const getUserByUsername = async (username: string): Promise<User | undefined> => {
        const q = query(collection(db, 'users'), where('username', '==', username.toLowerCase()), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const docData = querySnapshot.docs[0];
            return { uid: docData.id, ...docData.data() } as User;
        }
        return undefined;
    };
    
    const getAllUsers = async (): Promise<User[]> => {
        const querySnapshot = await getDocs(collection(db, "users"));
        return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
    };

    const value = useMemo(() => ({
        currentUser,
        firebaseUser,
        loading,
        rtdbName,
        isLocked: isLocked && !currentUser,
        handleGoogleSignIn,
        createUserProfile,
        logout,
        lockSite,
        unlockSite,
        isUsernameTaken,
        findUsers,
        getUserByUsername,
        updateUser,
        getAllUsers,
    }), [currentUser, firebaseUser, loading, rtdbName, isLocked, lockSite, unlockSite, isUsernameTaken, findUsers, getUserByUsername, updateUser, getAllUsers, handleGoogleSignIn, createUserProfile, logout]);

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