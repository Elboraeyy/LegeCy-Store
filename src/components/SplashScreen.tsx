"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  storeName?: string;
  onFinish?: () => void;
}

export default function SplashScreen({ storeName = "LegeCy", onFinish }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Hide splash after animation
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onFinish}>
      {isVisible && (
        <motion.div
          className="splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <div className="splash-content">
            {/* Logo Animation */}
            <motion.div
              className="splash-logo"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="38" stroke="currentColor" strokeWidth="2" />
                <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                <line x1="40" y1="40" x2="40" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="40" y1="40" x2="55" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="40" cy="40" r="3" fill="currentColor" />
              </svg>
            </motion.div>

            {/* Store Name */}
            <motion.h1
              className="splash-title"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {storeName}
            </motion.h1>

            {/* Tagline */}
            <motion.p
              className="splash-tagline"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              Timeless Elegance
            </motion.p>

            {/* Loading Bar */}
            <motion.div
              className="splash-loader"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
