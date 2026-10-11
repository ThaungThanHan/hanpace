"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { LandingPage } from "@/components/landing/LandingPage";
import { LoadingScreen } from "@/components/landing/loading/LoadingScreen";

const SCENE_WAIT_TIMEOUT = 10000;

type LoadingIntroProps = {
  delay?: number;
  fadeDuration?: number;
};

export function LoadingIntro({
  delay = 2000,
  fadeDuration = 0.75,
}: LoadingIntroProps) {
  const reduceMotion = useReducedMotion() === true;
  const transitionDuration = reduceMotion ? 0.18 : fadeDuration;
  const [minimumDelayElapsed, setMinimumDelayElapsed] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [navigationEnabled, setNavigationEnabled] = useState(false);
  const showLoading = !minimumDelayElapsed || !sceneReady;

  const handleSceneReady = useCallback(() => {
    setSceneReady(true);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setMinimumDelayElapsed(true);
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [delay]);

  useEffect(() => {
    const sceneFallback = window.setTimeout(() => {
      setSceneReady(true);
    }, SCENE_WAIT_TIMEOUT);

    return () => window.clearTimeout(sceneFallback);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#f6ead7]">
      <motion.div
        aria-hidden={!navigationEnabled}
        className="fixed inset-0"
        inert={!navigationEnabled}
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: showLoading ? 0 : 1 }}
        transition={{ duration: transitionDuration, ease: "easeOut" }}
      >
        <LandingPage
          navigationEnabled={navigationEnabled}
          onReady={handleSceneReady}
        />
      </motion.div>

      <AnimatePresence onExitComplete={() => setNavigationEnabled(true)}>
        {showLoading ? (
          <motion.div
            className="fixed inset-0 z-10"
            exit={{ opacity: 0 }}
            transition={{ duration: transitionDuration, ease: "easeInOut" }}
          >
            <LoadingScreen />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
