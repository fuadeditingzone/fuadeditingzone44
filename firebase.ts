import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCBGjkN5xzW1oZJPaE0fYMluj8fyoQHX5o",
  authDomain: "portfolio-b8772.firebaseapp.com",
  projectId: "portfolio-b8772",
  storageBucket: "portfolio-b8772.appspot.com",
  messagingSenderId: "675850016369",
  appId: "1:675850016369:web:fdc820d3ad2d65283dadd0",
  measurementId: "G-MP8QT5856D"
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);