"use client";

import { useCallback, useRef } from "react";
import type { LottieAnimationHandle } from "@/components/animation/LottieAnimation";
import type { LottieLoadStatus } from "./crowd";

export function useCrowdPlayback(expectedLottieCount: number, onReady?: () => void) {
  const crowdLottieRefs = useRef(new Map<string, LottieAnimationHandle>());
  const crowdPausedRef = useRef(false);
  const lottieStatusesRef = useRef(new Map<string, LottieLoadStatus>());
  const readyReportedRef = useRef(false);

  const handleCrowdAnimationRef = useCallback(
    (id: string, animation: LottieAnimationHandle | null) => {
      if (animation) {
        crowdLottieRefs.current.set(id, animation);
        if (crowdPausedRef.current) {
          animation.pause();
        }
      } else {
        crowdLottieRefs.current.delete(id);
      }
    },
    [],
  );

  const setCrowdPlaying = useCallback((playing: boolean) => {
    crowdPausedRef.current = !playing;

    // Lottie remembers the request and suppresses motion while reduced motion is on.
    crowdLottieRefs.current.forEach((animation) => {
      if (playing) {
        animation.play();
      } else {
        animation.pause();
      }
    });
  }, []);

  const handleLottieSettled = useCallback(
    (id: string, status: LottieLoadStatus) => {
      if (status === "ready" && crowdPausedRef.current) {
        crowdLottieRefs.current.get(id)?.pause();
      }

      lottieStatusesRef.current.set(id, status);
      if (readyReportedRef.current) {
        return;
      }

      // Failed characters render a static fallback, so they no longer block the scene.
      if (lottieStatusesRef.current.size >= expectedLottieCount) {
        readyReportedRef.current = true;
        onReady?.();
      }
    },
    [expectedLottieCount, onReady],
  );

  return { handleCrowdAnimationRef, handleLottieSettled, setCrowdPlaying };
}
