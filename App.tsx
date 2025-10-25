import React, { useState, useEffect } from 'react';
// Firebase imports will be resolved by the importmap in index.html
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  type User
} from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCA_nAtmaN9Bs7a5q-c9za5eSMnk0Ys5Xs",
  authDomain: "fuad-editing-zone.firebaseapp.com",
  projectId: "fuad-editing-zone",
  storageBucket: "fuad-editing-zone.firebasestorage.app",
  messagingSenderId: "832389657221",
  appId: "1:832389657221:web:8a85d5dda0803770376fec",
  measurementId: "G-ZCKW4GPDLT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleSignIn = () => {
    signInWithPopup(auth, provider)
      .catch((error) => {
        console.error("Authentication error:", error);
        alert(`Failed to sign in: ${error.message}`);
      });
  };

  const handleSignOut = () => {
    signOut(auth)
      .catch((error) => {
        console.error("Sign out error:", error);
        alert(`Failed to sign out: ${error.message}`);
      });
  };
  
  if (loading) {
    return <div className="loading-container"><h1>Loading...</h1></div>;
  }

  return (
    <div className="container">
      {user ? (
        <div className="user-info">
          <h1>Welcome, {user.displayName}!</h1>
          {user.photoURL && <img src={user.photoURL} alt="User profile" className="profile-pic" />}
          <p>Email: {user.email}</p>
          <button onClick={handleSignOut} className="button sign-out">Sign Out</button>
        </div>
      ) : (
        <div className="sign-in-container">
          <h1>Firebase Google Auth</h1>
          <p>Please sign in to continue.</p>
          <button onClick={handleSignIn} className="button sign-in">
            Sign in with Google
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
