import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCA_nAtmaN9Bs7a5q-c9za5eSMnk0Ys5Xs",
  authDomain: "fuad-editing-zone.firebaseapp.com",
  projectId: "fuad-editing-zone",
  storageBucket: "fuad-editing-zone.firebasestorage.app",
  messagingSenderId: "832389657221",
  appId: "1:832389657221:web:6e731b9a922c429b376fec",
  measurementId: "G-2QT4XLSNDQ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);