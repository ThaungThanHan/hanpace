"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import lottie, { type AnimationItem } from "lottie-web";
import { createLottiePlayback } from "./lottiePlayback";

type LottiePosition = number | string;

export type LottieAnimationHandle = {
  pause: () => void;
  play: () => void;
  setSpeed: (value: number) => void;
};

type LottieAnimationProps = {
  lottieName: string;
  loop?: boolean;
  /** Reactive playback intent; a changed value overrides the last play/pause call. */
  autoplay?: boolean;
  speed?: number;
  /** Seconds from creation (or a delay update) before first playback; play() honors it. */
  delay?: number;
  /** Starting position in seconds; changing it seeks without changing playback intent. */
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
  onReady?: () => void;
  onError?: (error: Error) => void;
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

export const LottieAnimation = forwardRef<
  LottieAnimationHandle,
  LottieAnimationProps
>(function LottieAnimation(
  {
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
    onReady,
    onError,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<ReturnType<typeof createLottiePlayback> | null>(null);
  // Preserve imperative requests made before the effect or when the asset changes.
  const playingOverrideRef = useRef<boolean | null>(null);
  const speedOverrideRef = useRef<number | null>(null);
  const optionsRef = useRef({ autoplay, delay, loop, speed, startOffset });
  const callbacksRef = useRef({ onReady, onError });
  const animationPath = resolveLottiePath(lottieName);

  useImperativeHandle(ref, () => ({
    pause: () => {
      playingOverrideRef.current = false;
      controllerRef.current?.pause();
    },
    play: () => {
      playingOverrideRef.current = true;
      controllerRef.current?.play();
    },
    setSpeed: (value) => {
      speedOverrideRef.current = value;
      controllerRef.current?.setSpeed(value);
    },
  }), []);

  useEffect(() => {
    callbacksRef.current = { onReady, onError };
  }, [onReady, onError]);

  useEffect(() => {
    if (optionsRef.current.autoplay !== autoplay) playingOverrideRef.current = null;
    if (optionsRef.current.speed !== speed) speedOverrideRef.current = null;
    optionsRef.current = { autoplay, delay, loop, speed, startOffset };
    controllerRef.current?.update(optionsRef.current);
  }, [autoplay, delay, loop, speed, startOffset]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animation: AnimationItem;
    try {
      animation = lottie.loadAnimation({
        autoplay: false,
        container,
        loop: optionsRef.current.loop,
        path: animationPath,
        renderer: "svg",
        rendererSettings: { progressiveLoad: true },
      });
    } catch (cause) {
      callbacksRef.current.onError?.(new Error(`Could not load animation: ${animationPath}`, { cause }));
      return;
    }

    const controller = createLottiePlayback(animation, optionsRef.current, motionPreference.matches);
    controllerRef.current = controller;
    if (playingOverrideRef.current !== null) {
      if (playingOverrideRef.current) controller.play();
      else controller.pause();
    }
    if (speedOverrideRef.current !== null) controller.setSpeed(speedOverrideRef.current);

    const handleReady = () => {
      if (controller.ready()) callbacksRef.current.onReady?.();
    };
    const handleError = () => {
      if (controller.fail()) {
        callbacksRef.current.onError?.(new Error(`Could not load or render animation: ${animationPath}`));
      }
    };
    const handleMotionChange = () => controller.setReducedMotion(motionPreference.matches);

    animation.addEventListener("DOMLoaded", handleReady);
    animation.addEventListener("data_failed", handleError);
    animation.addEventListener("error", handleError);
    motionPreference.addEventListener("change", handleMotionChange);

    return () => {
      controller.dispose();
      controllerRef.current = null;
      motionPreference.removeEventListener("change", handleMotionChange);
      animation.removeEventListener("DOMLoaded", handleReady);
      animation.removeEventListener("data_failed", handleError);
      animation.removeEventListener("error", handleError);
      animation.destroy();
    };
  }, [animationPath]);

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
});
