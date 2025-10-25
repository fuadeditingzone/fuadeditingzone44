// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration from your project
const firebaseConfig = {
  apiKey: "AIzaSyCA_nAtmaN9Bs7a5q-c9za5eSMnk0Ys5Xs",
  authDomain: "fuad-editing-zone.firebaseapp.com",
  projectId: "fuad-editing-zone",
  storageBucket: "fuad-editing-zone.firebasestorage.app",
  messagingSenderId: "832389657221",
  appId: "1:832389657221:web:98bec320f684d345376fec",
  measurementId: "G-QJNZVBS5P5"
};

// Check if the config has been filled out and is not using placeholders
const isConfigured = firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("YOUR_");

// Initialize Firebase only if the configuration is valid
const app = isConfigured ? initializeApp(firebaseConfig) : null;

// Export the initialized services, or null if not configured
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
export const firebaseInitialized = isConfigured;

if (!isConfigured) {
    console.warn("Firebase is not configured. Please add your credentials to firebase.ts. All user-related features will be disabled.");
}