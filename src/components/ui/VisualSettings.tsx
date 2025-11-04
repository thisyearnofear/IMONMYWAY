"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function VisualSettings() {
    const [isOpen, setIsOpen] = useState(false);
    const [webglEnabled, setWebglEnabled] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setWebglEnabled(localStorage.getItem('enable-webgl') === 'true');
        }
    }, []);

    const toggleWebGL = () => {
        const newValue = !webglEnabled;
        setWebglEnabled(newValue);

        if (typeof window !== 'undefined') {
            if (newValue) {
                localStorage.setItem('enable-webgl', 'true');
            } else {
                localStorage.removeItem('enable-webgl');
            }

            // Refresh to apply changes
            window.location.reload();
        }
    };

    return (
        <div className="fixed top-4 right-4 z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all duration-200"
                title="Visual Settings"
            >
                ⚙️
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        className="absolute top-12 right-0 bg-black/80 backdrop-blur-sm rounded-lg p-4 min-w-[200px] border border-white/20"
                    >
                        <h3 className="text-white font-medium mb-3">Visual Settings</h3>

                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-white text-sm">Enhanced Graphics</div>
                                <div className="text-white/60 text-xs">3D particle effects</div>
                            </div>
                            <button
                                onClick={toggleWebGL}
                                className={`w-12 h-6 rounded-full transition-colors duration-200 ${webglEnabled ? 'bg-blue-500' : 'bg-gray-600'
                                    }`}
                            >
                                <div
                                    className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 ${webglEnabled ? 'translate-x-6' : 'translate-x-0.5'
                                        }`}
                                />
                            </button>
                        </div>

                        {!webglEnabled && (
                            <div className="mt-3 text-xs text-white/60">
                                Disabled by default for better performance and reliability
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}