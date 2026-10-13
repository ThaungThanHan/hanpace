"use client";

import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import type { LottieAnimationHandle } from "@/components/animation/LottieAnimation";
import type { CrowdItem } from "./crowd";
import {
  ARTBOARD_LOGO, CROWD_ROWS, CROWD_EXIT_DURATION, CROWD_CHARACTER_STAGGER,
  CROWD_ROW_OFFSET, FEATURED_TARGET, FEATURED_ROTATION, FEATURED_FINAL_SPEED_RATIO,
} from "./sceneConfig";

export type LogoSectionHandle = {
  transitionToSection: (
    sectionIndex: number,
    options?: {
      duration?: number;
      immediate?: boolean;
    },
  ) => Promise<void>;
};

function getTargetXPercent({
  currentX,
  targetX,
  width,
}: {
  currentX: number;
  targetX: number;
  width: number;
}) {
  return -50 + ((targetX - currentX) / width) * 100;
}

function getTargetYPercent({
  currentY,
  height,
  targetY,
}: {
  currentY: number;
  height: number;
  targetY: number;
}) {
  return -50 + ((targetY - currentY) / height) * 100;
}

export function useSceneAnimation(featuredSlot: CrowdItem, setCrowdPlaying: (playing: boolean) => void) {
  const transitionRef = useRef<HTMLElement>(null);
  const sceneFadeRef = useRef<HTMLDivElement>(null);
  const artboardLogoRef = useRef<HTMLDivElement>(null);
  const floatingBackgroundRef = useRef<HTMLDivElement>(null);
  const overlayLogoRef = useRef<HTMLDivElement>(null);
  const sectionArtRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);
  const featuredLottieRef = useRef<LottieAnimationHandle>(null);
  const heroTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const timelineTweenRef = useRef<gsap.core.Tween | gsap.core.Timeline | null>(null);
  const reduceMotionRef = useRef(false);

  const transitionToSection = useCallback<LogoSectionHandle["transitionToSection"]>(
    (sectionIndex, options = {}) => {
      const timeline = heroTimelineRef.current;
      const targetProgress = sectionIndex === 0 ? 0 : 1;

      timelineTweenRef.current?.kill();
      if (sectionIndex === 0) {
        setCrowdPlaying(true);
      }

      if (!timeline) {
        return Promise.resolve();
      }

      if (options.immediate) {
        timeline.progress(targetProgress).pause();
        if (sectionIndex !== 0) {
          setCrowdPlaying(false);
        }
        return Promise.resolve();
      }

      const sceneFade = sceneFadeRef.current;
      if (reduceMotionRef.current && sceneFade) {

        return new Promise((resolve) => {
          timelineTweenRef.current = gsap
            .timeline({
              onComplete: () => {
                timelineTweenRef.current = null;
                if (sectionIndex !== 0) {
                  setCrowdPlaying(false);
                }
                resolve();
              },
              onInterrupt: () => {
                timelineTweenRef.current = null;
                gsap.set(sceneFade, { opacity: 1 });
                resolve();
              },
            })
            // Fade the scene as a whole; its timeline owns each child's visibility.
            .to(sceneFade, {
              opacity: 0,
              duration: (options.duration ?? 0.24) / 2,
              ease: "power1.out",
            })
            .call(() => timeline.progress(targetProgress).pause())
            .to(sceneFade, {
              opacity: 1,
              duration: (options.duration ?? 0.24) / 2,
              ease: "power1.out",
            });
        });
      }

      const distance = Math.abs(timeline.progress() - targetProgress);

      if (distance < 0.001) {
        timeline.progress(targetProgress).pause();
        if (sectionIndex !== 0) {
          setCrowdPlaying(false);
        }
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        timelineTweenRef.current = gsap.to(timeline, {
          duration: (options.duration ?? 0.9) * distance,
          ease: "sine.inOut",
          onComplete: () => {
            timelineTweenRef.current = null;
            if (sectionIndex !== 0) {
              setCrowdPlaying(false);
            }
            resolve();
          },
          onInterrupt: () => {
            timelineTweenRef.current = null;
            resolve();
          },
          progress: targetProgress,
        });
      });
    },
    [setCrowdPlaying],
  );

  useEffect(() => {
    const transition = transitionRef.current;
    const sceneFade = sceneFadeRef.current;
    const artboardLogo = artboardLogoRef.current;
    const floatingBackground = floatingBackgroundRef.current;
    const overlayLogo = overlayLogoRef.current;
    const sectionArt = sectionArtRef.current;
    const featured = featuredRef.current;
    const featuredLottie = featuredLottieRef.current;

    if (
      !transition ||
      !sceneFade ||
      !artboardLogo ||
      !floatingBackground ||
      !overlayLogo ||
      !sectionArt ||
      !featured
    ) {
      return;
    }

    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    reduceMotionRef.current = motionPreference.matches;
    const handleMotionChange = () => {
      reduceMotionRef.current = motionPreference.matches;
    };
    motionPreference.addEventListener("change", handleMotionChange);

    const speedProxy = {
      value: featuredSlot.speed,
    };
    const artboardLogoTargetXPercent = getTargetXPercent({
      currentX: ARTBOARD_LOGO.x,
      targetX: ARTBOARD_LOGO.targetX,
      width: ARTBOARD_LOGO.width,
    });
    const artboardLogoTargetYPercent = getTargetYPercent({
      currentY: ARTBOARD_LOGO.y,
      height: ARTBOARD_LOGO.height,
      targetY: ARTBOARD_LOGO.targetY,
    });
    const featuredTargetXPercent = getTargetXPercent({
      currentX: featuredSlot.x,
      targetX: FEATURED_TARGET.x,
      width: featuredSlot.size,
    });
    const featuredTargetYPercent = getTargetYPercent({
      currentY: featuredSlot.y,
      height: featuredSlot.size,
      targetY: FEATURED_TARGET.y,
    });

    const ctx = gsap.context(() => {
      gsap.set(sceneFade, { opacity: 1 });
      gsap.set(artboardLogo, {
        autoAlpha: 0,
        force3D: false,
        scale: ARTBOARD_LOGO.targetScale,
        transformOrigin: "center center",
        x: 0,
        y: 0,
        xPercent: artboardLogoTargetXPercent,
        yPercent: artboardLogoTargetYPercent,
      });
      gsap.set(overlayLogo, {
        autoAlpha: 1,
      });
      gsap.set(floatingBackground, {
        autoAlpha: 0,
      });
      gsap.set(sectionArt, {
        autoAlpha: 0,
        scale: 0.98,
        transformOrigin: "center center",
      });
      gsap.set(featured, {
        autoAlpha: 1,
        transformOrigin: "center center",
        // Clear pixel offsets parsed from CSS centering before applying percentages.
        x: 0,
        y: 0,
        xPercent: -50,
        yPercent: -50,
      });

      const timeline = gsap.timeline({
        defaults: {
          ease: "none",
        },
        paused: true,
      });

      CROWD_ROWS.forEach((_, rowIndex) => {
        const rowCharacters = transition.querySelectorAll<HTMLElement>(
          `[data-crowd-row="${rowIndex}"]`,
        );

        timeline.to(
          rowCharacters,
          {
            autoAlpha: 0,
            duration: CROWD_EXIT_DURATION,
            ease: "power2.inOut",
            scale: 0.985,
            stagger: {
              amount: CROWD_CHARACTER_STAGGER * rowCharacters.length,
              from: "center",
            },
            yPercent: 92,
          },
          rowIndex * CROWD_ROW_OFFSET,
        );
      });

      timeline.to(
        featured,
        {
          autoAlpha: 1,
          duration: 0.62,
          rotation: FEATURED_ROTATION,
          scale: FEATURED_TARGET.scale,
          xPercent: featuredTargetXPercent,
          yPercent: featuredTargetYPercent,
        },
        0.15,
      );

      timeline.to(
        speedProxy,
        {
          duration: 0.45,
          onUpdate: () => {
            featuredLottie?.setSpeed(speedProxy.value);
          },
          value: featuredSlot.speed * FEATURED_FINAL_SPEED_RATIO,
        },
        0.3,
      );

      timeline.to(
        overlayLogo,
        {
          autoAlpha: 0,
          duration: 0.36,
        },
        0.28,
      );

      timeline.to(
        artboardLogo,
        {
          autoAlpha: 1,
          duration: 0.42,
          ease: "power1.out",
        },
        0.36,
      );

      timeline.to(
        floatingBackground,
        {
          autoAlpha: 1,
          duration: 0.36,
          ease: "power1.out",
        },
        0.36,
      );

      timeline.to(
        sectionArt,
        {
          autoAlpha: 1,
          duration: 0.48,
          scale: 1,
        },
        0.4,
      );

      timeline.progress(0).pause();
      heroTimelineRef.current = timeline;
    }, transition);

    return () => {
      motionPreference.removeEventListener("change", handleMotionChange);
      timelineTweenRef.current?.kill();
      timelineTweenRef.current = null;
      heroTimelineRef.current?.kill();
      heroTimelineRef.current = null;
      featuredLottie?.setSpeed(featuredSlot.speed);
      ctx.revert();
    };
  }, [featuredSlot]);


  return {
    transitionToSection,
    refs: { transitionRef, sceneFadeRef, artboardLogoRef, floatingBackgroundRef, overlayLogoRef, sectionArtRef, featuredRef, featuredLottieRef },
  };
}
