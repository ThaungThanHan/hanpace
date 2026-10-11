"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import lottie, { type AnimationItem } from "lottie-web";

type LottiePosition = number | string;

export type LottieAnimationHandle = {
  pause: () => void;
  play: () => void;
  setSpeed: (value: number) => void;
};

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
  onReady?: () => void;
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
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);
  const manuallyPausedRef = useRef(false);
  const onReadyRef = useRef(onReady);
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

  useImperativeHandle(
    ref,
    () => ({
      pause: () => {
        manuallyPausedRef.current = true;
        animationRef.current?.pause();
      },
      play: () => {
        manuallyPausedRef.current = false;
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          animationRef.current?.play();
        }
      },
      setSpeed: (value) => {
        animationRef.current?.setSpeed(value);
      },
    }),
    [],
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
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const reduceMotion = motionPreference.matches;
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
    let ready = false;

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
    const showStillFrame = () => {
      const animation = animationRef.current;

      if (animation) {
        const frame = playbackRef.current.startOffset > 0
          ? playbackRef.current.startOffset * (animation.frameRate || 60)
          : (animation.frameRate || 60) / 3;
        animation.goToAndStop(Math.min(frame, animation.totalFrames - 1), true);
      }
    };
    const handleReadyWithStartOffset = () => {
      ready = true;
      if (motionPreference.matches) {
        showStillFrame();
      } else {
        applyStartOffset();
      }
      onReadyRef.current?.();
    };
    const handleReady = () => {
      ready = true;
      if (motionPreference.matches) {
        showStillFrame();
      } else if (
        playbackRef.current.autoplay &&
        !manuallyPausedRef.current &&
        timeout === undefined
      ) {
        applyStartOffset();
        animationRef.current?.play();
      }

      onReadyRef.current?.();
    };
    const handleMotionChange = () => {
      const animation = animationRef.current;

      animation?.setLoop(
        motionPreference.matches ? false : playbackRef.current.loop,
      );
      if (!ready || !animation) {
        return;
      }

      if (motionPreference.matches) {
        showStillFrame();
      } else if (
        playbackRef.current.autoplay &&
        !manuallyPausedRef.current &&
        timeout === undefined
      ) {
        applyStartOffset();
        animation.play();
      }
    };

    motionPreference.addEventListener("change", handleMotionChange);

    if (!reduceMotion && playback.autoplay && playback.delay <= 0) {
      animationRef.current.addEventListener(
        "DOMLoaded",
        handleReadyWithStartOffset,
      );
    } else {
      animationRef.current.addEventListener("DOMLoaded", handleReady);
    }

    if (!reduceMotion && playback.autoplay && playback.delay > 0) {
      timeout = window.setTimeout(() => {
        timeout = undefined;
        if (motionPreference.matches) {
          return;
        }
        applyStartOffset();
        animationRef.current?.play();
      }, playback.delay * 1000);
    }

    return () => {
      if (timeout !== undefined) {
        window.clearTimeout(timeout);
      }

      motionPreference.removeEventListener("change", handleMotionChange);

      animationRef.current?.removeEventListener(
        "DOMLoaded",
        handleReadyWithStartOffset,
      );
      animationRef.current?.removeEventListener("DOMLoaded", handleReady);
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
});
