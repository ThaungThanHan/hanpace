"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HeroSection } from "@/components/landing/HeroSection";
import { LoadingScreen } from "@/components/landing/loading/LoadingScreen";

type LoadingIntroProps = {
  delay?: number;
  fadeDuration?: number;
};

export function LoadingIntro({
  delay = 3000,
  fadeDuration = 0.75,
}: LoadingIntroProps) {
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setShowLoading(false);
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [delay]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f6ead7]">
      <motion.div
        aria-hidden={showLoading}
        initial={{ opacity: 0 }}
        animate={{ opacity: showLoading ? 0 : 1 }}
        transition={{ duration: fadeDuration, ease: "easeOut" }}
      >
        <HeroSection />
      </motion.div>

      <AnimatePresence>
        {showLoading ? (
          <motion.div
            className="absolute inset-0 z-10"
            exit={{ opacity: 0 }}
            transition={{ duration: fadeDuration, ease: "easeInOut" }}
          >
            <LoadingScreen label="Loading..." />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
