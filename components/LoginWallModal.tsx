import React from 'react';
import { useUser } from '../contexts/UserContext';
import { GoogleIcon } from './Icons';
import { LOGO_URL } from '../constants';

export const LoginWallModal: React.FC = () => {
    const { login } = useUser();

    return (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
            <div className="relative bg-gray-900/80 border border-red-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-red-500/20 text-center transform-style-3d animate-flip-in-3d">
                <img src={LOGO_URL} alt="Logo" className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Guest Session Expired</h2>
                <p className="text-gray-300 mb-6">
                    Please sign in with Google to continue exploring and unlock all features, including the interactive AI assistant.
                </p>
                <button
                    onClick={login}
                    className="group w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-3 px-4 rounded-lg transition-all duration-300 hover:bg-gray-200 transform hover:scale-105"
                >
                    <GoogleIcon className="w-6 h-6" />
                    <span>Sign in with Google</span>
                </button>
            </div>
        </div>
    );
};