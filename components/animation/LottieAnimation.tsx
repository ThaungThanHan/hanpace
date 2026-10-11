"use client";

import { useEffect, useMemo, useRef } from "react";
import lottie, { type AnimationItem } from "lottie-web";

type LottiePosition = number | string;

type LottieAnimationProps = {
  lottieName: string;
  loop?: boolean;
  autoplay?: boolean;
  speed?: number;
  delay?: number;
  startOffset?: number;
  size?: number | string;
  positionX?: LottiePosition;
  positionY?: LottiePosition;
  positionZ?: LottiePosition;
  left?: LottiePosition;
  top?: LottiePosition;
  zIndex?: number;
  className?: string;
  ariaLabel?: string;
};

function toCssLength(value: LottiePosition = 0) {
  return typeof value === "number" ? `${value}px` : value;
}

function resolveLottiePath(lottieName: string) {
  if (lottieName.startsWith("/") || lottieName.startsWith("http")) {
    return lottieName;
  }

  return `/assets/lottie/${lottieName}`;
}

export function LottieAnimation({
  lottieName,
  loop = true,
  autoplay = true,
  speed = 1,
  delay = 0,
  startOffset = 0,
  size = "100%",
  positionX = 0,
  positionY = 0,
  positionZ = 0,
  left,
  top,
  zIndex,
  className = "",
  ariaLabel,
}: LottieAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);
  const playbackRef = useRef({
    autoplay,
    delay,
    loop,
    speed,
    startOffset,
  });
  const animationPath = useMemo(
    () => resolveLottiePath(lottieName),
    [lottieName],
  );

  useEffect(() => {
    playbackRef.current = {
      autoplay,
      delay,
      loop,
      speed,
      startOffset,
    };
  }, [autoplay, delay, loop, speed, startOffset]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const playback = playbackRef.current;

    const shouldAutoplay = reduceMotion
      ? false
      : playback.autoplay && playback.delay <= 0;

    animationRef.current = lottie.loadAnimation({
      autoplay: shouldAutoplay,
      container,
      loop: reduceMotion ? false : playback.loop,
      path: animationPath,
      renderer: "svg",
      rendererSettings: {
        progressiveLoad: true,
      },
    });
    animationRef.current.setSpeed(playback.speed);
    let timeout: number | undefined;

    const applyStartOffset = () => {
      const animation = animationRef.current;

      if (!animation) {
        return;
      }

      const { startOffset: currentStartOffset } = playbackRef.current;

      if (currentStartOffset <= 0) {
        return;
      }

      const frameRate = animation.frameRate || 60;
      const offsetFrame = currentStartOffset * frameRate;
      animation.goToAndPlay(offsetFrame, true);
    };

    if (!reduceMotion && playback.autoplay && playback.delay <= 0) {
      animationRef.current.addEventListener("DOMLoaded", applyStartOffset);
    }

    if (!reduceMotion && playback.autoplay && playback.delay > 0) {
      timeout = window.setTimeout(() => {
        applyStartOffset();
        animationRef.current?.play();
      }, playback.delay * 1000);
    }

    return () => {
      if (timeout !== undefined) {
        window.clearTimeout(timeout);
      }

      animationRef.current?.removeEventListener("DOMLoaded", applyStartOffset);
      animationRef.current?.destroy();
      animationRef.current = null;
    };
  }, [animationPath]);

  useEffect(() => {
    animationRef.current?.setSpeed(speed);
  }, [speed]);

  return (
    <div
      ref={containerRef}
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      className={className}
      role={ariaLabel ? "img" : undefined}
      style={{
        display: "block",
        flexShrink: 0,
        height: toCssLength(size),
        left: left === undefined ? undefined : toCssLength(left),
        top: top === undefined ? undefined : toCssLength(top),
        transform: `translate3d(${toCssLength(positionX)}, ${toCssLength(
          positionY,
        )}, ${toCssLength(positionZ)})`,
        width: toCssLength(size),
        zIndex,
      }}
    />
  );
}
