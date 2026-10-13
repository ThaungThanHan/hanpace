"use client";

import {
  forwardRef,
  useEffect,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import Image from "next/image";
import gsap from "gsap";
import {
  LottieAnimation,
  type LottieAnimationHandle,
} from "@/components/animation/LottieAnimation";

const ARTBOARD_WIDTH = 1920;
const ARTBOARD_HEIGHT = 1080;
const FEATURED_ROW = 2;
const FEATURED_INDEX = 3;
const FEATURED_ROTATION = -90;
const FEATURED_FINAL_SPEED_RATIO = 0.3;
const CROWD_EXIT_DURATION = 0.58;
const CROWD_ROW_OFFSET = 0.06;
const CROWD_CHARACTER_STAGGER = 0.018;

const FLOATING_ASSETS = [
  {
    src: "/assets/images/leaf.svg",
    left: "5%",
    width: "clamp(130px, 14vw, 320px)",
    duration: 4.8,
    progress: 0.05,
    driftX: "10vw",
    rotation: [-12, 18],
    opacity: 0.54,
  },
  {
    src: "/assets/images/plant.svg",
    left: "17%",
    width: "clamp(150px, 16vw, 360px)",
    duration: 5.7,
    progress: 0.22,
    driftX: "-7vw",
    rotation: [7, -14],
    opacity: 0.48,
  },
  {
    src: "/assets/images/leaf.svg",
    left: "31%",
    width: "clamp(118px, 13vw, 300px)",
    duration: 5.1,
    progress: 0.44,
    driftX: "8vw",
    rotation: [20, -12],
    opacity: 0.5,
  },
  {
    src: "/assets/images/plant.svg",
    left: "43%",
    width: "clamp(160px, 17vw, 380px)",
    duration: 6.2,
    progress: 0.66,
    driftX: "-10vw",
    rotation: [-8, 16],
    opacity: 0.44,
  },
  {
    src: "/assets/images/leaf.svg",
    left: "56%",
    width: "clamp(126px, 14vw, 315px)",
    duration: 4.6,
    progress: 0.82,
    driftX: "7vw",
    rotation: [18, -10],
    opacity: 0.52,
  },
  {
    src: "/assets/images/plant.svg",
    left: "68%",
    width: "clamp(146px, 15vw, 350px)",
    duration: 5.4,
    progress: 0.12,
    driftX: "-8vw",
    rotation: [-6, 12],
    opacity: 0.46,
  },
  {
    src: "/assets/images/leaf.svg",
    left: "80%",
    width: "clamp(116px, 13vw, 290px)",
    duration: 5,
    progress: 0.34,
    driftX: "9vw",
    rotation: [-18, 10],
    opacity: 0.5,
  },
  {
    src: "/assets/images/plant.svg",
    left: "91%",
    width: "clamp(140px, 15vw, 340px)",
    duration: 5.9,
    progress: 0.58,
    driftX: "-6vw",
    rotation: [12, -10],
    opacity: 0.43,
  },
] as const;

const FEATURED_TARGET = {
  x: 960,
  y: 500,
  scale: 0.35,
};

const ARTBOARD_LOGO = {
  x: 210,
  y: 108,
  width: 420,
  height: 150,
  targetX: 1255,
  targetY: 405,
  targetScale: 2.35,
};

const CROWD_ROWS = [
  {
    y: 350,
    count: 7,
    baseSize: 900,
    spacing: 300,
    xOffset: 50,
    speedMin: 0.93,
    speedMax: 1.07,
  },

  {
    y: 620,
    count: 7,
    baseSize: 1200,
    spacing: 330,
    xOffset: -50,
    speedMin: 0.96,
    speedMax: 1.1,
  },

  {
    y: 900,
    count: 6,
    baseSize: 1500,
    spacing: 390,
    xOffset: -150,
    speedMin: 1,
    speedMax: 1.12,
  },
] as const;

type CrowdItem = {
  id: string;
  rowIndex: number;
  x: number;
  y: number;
  size: number;
  z: number;
  startOffset: number;
  speed: number;
};

type GeneratedCrowd = {
  crowd: CrowdItem[];
  featuredSlot: CrowdItem;
};

export type LogoSectionHandle = {
  transitionToSection: (
    sectionIndex: number,
    options?: {
      duration?: number;
      immediate?: boolean;
    },
  ) => Promise<void>;
};

type LogoSectionProps = {
  children?: ReactNode;
  onReady?: () => void;
};

type ArtboardItemProps = {
  children?: ReactNode;
  className?: string;
  height?: number;
  itemRef?: RefObject<HTMLDivElement | null>;
  style?: CSSProperties;
  width: number;
  x: number;
  y: number;
};

function mulberry32(seed: number) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function generateCrowd({
  seed = 12345,
  rows = CROWD_ROWS,
}: {
  seed?: number;
  rows?: ReadonlyArray<(typeof CROWD_ROWS)[number]>;
} = {}): GeneratedCrowd {
  const random = mulberry32(seed);
  const crowd: CrowdItem[] = [];
  let featuredSlot: CrowdItem | undefined;

  rows.forEach((row, rowIndex) => {
    const totalWidth = (row.count - 1) * row.spacing;
    const startX = ARTBOARD_WIDTH / 2 - totalWidth / 2 + row.xOffset;

    for (let i = 0; i < row.count; i += 1) {
      const x = startX + i * row.spacing;
      const y = row.y;
      const size = row.baseSize * (0.95 + random() * 0.1);
      const clampedX = clamp(x, 40, ARTBOARD_WIDTH - 40);
      const clampedY = clamp(y, 40, ARTBOARD_HEIGHT - 40);
      const item = {
        id: `character-${rowIndex}-${i}`,
        rowIndex,
        x: clampedX,
        y: clampedY,
        size,
        z: Math.round(y),
        startOffset: random(),
        speed: row.speedMin + random() * (row.speedMax - row.speedMin),
      };

      if (rowIndex === FEATURED_ROW && i === FEATURED_INDEX) {
        featuredSlot = {
          ...item,
          id: "featured-character",
        };
        continue;
      }

      crowd.push(item);
    }
  });

  if (!featuredSlot) {
    throw new Error("Featured crowd slot was not generated.");
  }

  return {
    crowd,
    featuredSlot,
  };
}

function toXPercent(x: number) {
  return `${(x / ARTBOARD_WIDTH) * 100}%`;
}

function toYPercent(y: number) {
  return `${(y / ARTBOARD_HEIGHT) * 100}%`;
}

function ArtboardItem({
  children,
  className = "",
  height,
  itemRef,
  style,
  width,
  x,
  y,
}: ArtboardItemProps) {
  return (
    <div
      ref={itemRef}
      className={`absolute ${className}`}
      style={{
        height: height === undefined ? undefined : toYPercent(height),
        left: toXPercent(x),
        top: toYPercent(y),
        transform: "translate3d(-50%, -50%, 0)",
        transformOrigin: "center center",
        width: toXPercent(width),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

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

function LogoArtwork() {
  const textProps = {
    x: 0,
    y: 105,
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: 102,
    fontWeight: 900,
    letterSpacing: -8,
  } as const;

  return (
    <svg
      viewBox="0 0 540 150"
      className="block h-full w-full overflow-visible"
      aria-hidden="true"
      focusable="false"
      style={{ textRendering: "geometricPrecision" }}
    >
      <text
        {...textProps}
        dx="0"
        dy="3"
        fill="none"
        stroke="rgba(24,60,46,0.12)"
        strokeWidth="4"
        paintOrder="stroke fill"
      >
        Pace
      </text>
      <text
        {...textProps}
        fill="#fff5d9"
        stroke="rgba(40,93,133,0.7)"
        strokeWidth="4"
        paintOrder="stroke fill"
      >
        Pace
      </text>
    </svg>
  );
}

function ArtboardLogo({
  logoRef,
}: {
  logoRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <ArtboardItem
      itemRef={logoRef}
      x={ARTBOARD_LOGO.x}
      y={ARTBOARD_LOGO.y}
      width={ARTBOARD_LOGO.width}
      height={ARTBOARD_LOGO.height}
      style={{
        pointerEvents: "none",
        willChange: "transform",
        zIndex: 760,
      }}
    >
      <LogoArtwork />
    </ArtboardItem>
  );
}

function OverlayLogo({
  overlayLogoRef,
}: {
  overlayLogoRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={overlayLogoRef}
      className="
        pointer-events-none
        absolute
        left-3
        top-3
        h-[58px]
        w-[210px]
        sm:left-4
        sm:top-4
        sm:h-[68px]
        sm:w-[248px]
        md:left-6
        md:top-4
        md:h-[82px]
        md:w-[300px]
      "
    >
      <LogoArtwork />
    </div>
  );
}

function SectionArtwork({
  sectionArtRef,
}: {
  sectionArtRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={sectionArtRef}
      className="absolute inset-0"
      style={{ zIndex: 120 }}
      aria-hidden="true"
    />
  );
}

function CrowdCharacter({
  featuredLottieRef,
  featuredRef,
  item,
  onAnimationRef,
  onReady,
}: {
  featuredLottieRef?: RefObject<LottieAnimationHandle | null>;
  featuredRef?: RefObject<HTMLDivElement | null>;
  item: CrowdItem;
  onAnimationRef: (id: string, animation: LottieAnimationHandle | null) => void;
  onReady?: (id: string) => void;
}) {
  const featured = item.id === "featured-character";
  const handleAnimationRef = useCallback(
    (animation: LottieAnimationHandle | null) => {
      onAnimationRef(item.id, animation);
    },
    [item.id, onAnimationRef],
  );

  return (
    <ArtboardItem
      itemRef={featured ? featuredRef : undefined}
      x={item.x}
      y={item.y}
      width={item.size}
      className={featured ? "featured-character" : ""}
      style={{
        aspectRatio: "1 / 1",
        pointerEvents: "none",
        willChange: featured ? "transform" : undefined,
        zIndex: item.z,
      }}
    >
      <div data-crowd-row={featured ? undefined : item.rowIndex} className="h-full w-full">
        <LottieAnimation
          ref={featured ? featuredLottieRef : handleAnimationRef}
          lottieName="walking.json"
          speed={item.speed}
          startOffset={item.startOffset}
          onReady={() => onReady?.(item.id)}
          ariaLabel={
            featured
              ? "Featured character animation"
              : "Decorative character animation"
          }
          className="h-full w-full pointer-events-none"
        />
      </div>
    </ArtboardItem>
  );
}

function VisualStage({
  visualStageRef,
  crowd,
  artboardLogoRef,
  featuredLottieRef,
  featuredRef,
  featuredSlot,
  onAnimationRef,
  onLottieReady,
  sectionArtRef,
}: {
  visualStageRef: RefObject<HTMLDivElement | null>;
  artboardLogoRef: RefObject<HTMLDivElement | null>;
  crowd: CrowdItem[];
  featuredLottieRef: RefObject<LottieAnimationHandle | null>;
  featuredRef: RefObject<HTMLDivElement | null>;
  featuredSlot: CrowdItem;
  onAnimationRef: (id: string, animation: LottieAnimationHandle | null) => void;
  onLottieReady?: (id: string) => void;
  sectionArtRef: RefObject<HTMLDivElement | null>;
}) {
  const sortedCrowd = useMemo(
    () => [...crowd].sort((a, b) => a.z - b.z),
    [crowd],
  );

  return (
    <div
      ref={visualStageRef}
      className="pointer-events-none absolute inset-0 z-40 overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          aspectRatio: "16 / 9",
          contain: "layout paint",
          overflow: "visible",
          pointerEvents: "none",
          transform: "translate(-50%, -50%)",
          width: "max(100vw, calc(100vh * 16 / 9))",
        }}
      >
        <SectionArtwork sectionArtRef={sectionArtRef} />
        <ArtboardLogo logoRef={artboardLogoRef} />

        {sortedCrowd.map((item) => (
          <CrowdCharacter
            key={item.id}
            item={item}
            onAnimationRef={onAnimationRef}
            onReady={onLottieReady}
          />
        ))}
        <CrowdCharacter
          item={featuredSlot}
          featuredRef={featuredRef}
          featuredLottieRef={featuredLottieRef}
          onAnimationRef={onAnimationRef}
          onReady={onLottieReady}
        />
      </div>
    </div>
  );
}

function FloatingBackground({
  backgroundRef,
}: {
  backgroundRef: RefObject<HTMLDivElement | null>;
}) {
  const assetRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const reduceMotion = motionPreference.matches;
    const timelines: Array<{ timeline: gsap.core.Timeline; progress: number }> = [];

    const ctx = gsap.context(() => {
      assetRefs.current.forEach((asset, index) => {
        if (!asset) {
          return;
        }

        const config = FLOATING_ASSETS[index];

        if (!config) {
          gsap.set(asset, {
            autoAlpha: 0,
            rotate: 0,
            x: 0,
            y: 0,
          });
          return;
        }

        const timeline = gsap.timeline({
          paused: reduceMotion,
          repeat: reduceMotion ? 0 : -1,
        });

        timeline.set(asset, {
          autoAlpha: config.opacity,
          rotate: config.rotation[0],
          x: 0,
          y: "24vh",
        });

        timeline.to(
          asset,
          {
            duration: config.duration,
            ease: "none",
            rotate: config.rotation[1],
            x: config.driftX,
            y: "-132vh",
          },
          0,
        );

        timeline.progress(config.progress);
        timelines.push({ timeline, progress: config.progress });
      });
    });

    const handleMotionChange = () => {
      timelines.forEach(({ timeline, progress }) => {
        if (motionPreference.matches) {
          timeline.pause().repeat(0).progress(progress);
        } else {
          timeline.repeat(-1).play();
        }
      });
    };
    motionPreference.addEventListener("change", handleMotionChange);

    return () => {
      motionPreference.removeEventListener("change", handleMotionChange);
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={backgroundRef}
      className="pointer-events-none absolute inset-0 z-[30] overflow-hidden"
      aria-hidden="true"
    >
      {FLOATING_ASSETS.map((asset, index) => (
        <div
          key={`${asset.src}-${index}`}
          ref={(node) => {
            assetRefs.current[index] = node;
          }}
          className="group pointer-events-auto absolute bottom-[-24vh] block select-none"
          style={{
            left: asset.left,
            width: asset.width,
            willChange: "transform, opacity",
          }}
        >
          <Image
            src={asset.src}
            alt=""
            width={180}
            height={180}
            unoptimized
            draggable={false}
            className="block h-auto w-full select-none motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:group-hover:scale-140"
          />
        </div>
      ))}
    </div>
  );
}

function DiscordIcon() {
  return (
    <Image
      src="/assets/images/discord.svg"
      alt=""
      width={24}
      height={24}
      unoptimized
      className="h-[54%] w-[54%] brightness-0 invert"
      aria-hidden="true"
    />
  );
}

function FacebookIcon() {
  return (
    <Image
      src="/assets/images/facebook.svg"
      alt=""
      width={24}
      height={24}
      unoptimized
      className="h-[54%] w-[54%] brightness-0 invert"
      aria-hidden="true"
    />
  );
}

function LineIcon() {
  return (
    <Image
      src="/assets/images/line.svg"
      alt=""
      width={24}
      height={24}
      unoptimized
      className="h-[54%] w-[54%] brightness-0 invert"
      aria-hidden="true"
    />
  );
}

function SocialButton({
  ariaLabel,
  children,
}: {
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className="
        pointer-events-auto
        cursor-pointer
        flex
        h-10
        w-10
        items-center
        justify-center
        rounded-full
        bg-[#5265f6]
        text-white
        shadow-[0_4px_0_rgba(24,60,46,0.18)]
        motion-safe:transition-transform
        motion-safe:duration-200
        motion-safe:hover:scale-105
        hover:brightness-105
        sm:h-11
        sm:w-11
        md:h-12
        md:w-12
      "
    >
      {children}
    </button>
  );
}

function ResponsiveOverlay({
  overlayLogoRef,
  overlayRef,
}: {
  overlayLogoRef: RefObject<HTMLDivElement | null>;
  overlayRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={overlayRef}
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: 100 }}
    >
      <div>
        <OverlayLogo overlayLogoRef={overlayLogoRef} />

        <div
          className="
            absolute
            bottom-4
            left-4
            flex
            gap-2
            sm:bottom-5
            sm:left-5
            sm:gap-3
            md:bottom-7
            md:left-7
          "
        >
          <SocialButton ariaLabel="Discord">
            <DiscordIcon />
          </SocialButton>
          <SocialButton ariaLabel="Facebook">
            <FacebookIcon />
          </SocialButton>
          <SocialButton ariaLabel="Line">
            <LineIcon />
          </SocialButton>
        </div>

        <button
          type="button"
          onClick={() => {}}
          className="
            pointer-events-auto
            absolute
            bottom-0
            cursor-pointer
            right-0
            flex
            h-[54px]
            w-[132px]
            items-center
            justify-center
            rounded-bl-[18px]
            rounded-tl-[38px]
            rounded-tr-[18px]
            bg-[#2647a8]
            text-[1rem]
            font-medium
            lowercase
            tracking-[0.18em]
            text-white
            shadow-[0_4px_0_rgba(24,60,46,0.14)]
            motion-safe:transition-transform
            motion-safe:duration-200
            motion-safe:hover:scale-[1.03]
            hover:brightness-105
            sm:h-[60px]
            sm:w-[150px]
            sm:text-lg
            md:h-[68px]
            md:w-[168px]
            md:text-xl
          "
        >
          Join us!
        </button>
      </div>
    </div>
  );
}

export const LogoSection = forwardRef<LogoSectionHandle, LogoSectionProps>(
function LogoSection({ children, onReady }, ref) {
  const transitionRef = useRef<HTMLElement>(null);
  const visualStageRef = useRef<HTMLDivElement>(null);
  const artboardLogoRef = useRef<HTMLDivElement>(null);
  const floatingBackgroundRef = useRef<HTMLDivElement>(null);
  const overlayLogoRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const sectionArtRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);
  const featuredLottieRef = useRef<LottieAnimationHandle>(null);
  const crowdLottieRefs = useRef(new Map<string, LottieAnimationHandle>());
  const crowdPausedRef = useRef(false);
  const heroTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const timelineTweenRef = useRef<gsap.core.Tween | gsap.core.Timeline | null>(null);
  const readyLottieIdsRef = useRef(new Set<string>());
  const readyReportedRef = useRef(false);
  const reduceMotionRef = useRef(false);
  const { crowd, featuredSlot } = useMemo(
    () => generateCrowd({ seed: 12345 }),
    [],
  );
  const expectedLottieCount = crowd.length + 1;

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
    if (reduceMotionRef.current && playing) {
      return;
    }

    crowdLottieRefs.current.forEach((animation) => {
      if (playing) {
        animation.play();
      } else {
        animation.pause();
      }
    });
  }, []);

  const handleLottieReady = useCallback(
    (id: string) => {
      if (crowdPausedRef.current) {
        crowdLottieRefs.current.get(id)?.pause();
      }

      if (readyReportedRef.current) {
        return;
      }

      readyLottieIdsRef.current.add(id);

      if (readyLottieIdsRef.current.size >= expectedLottieCount) {
        readyReportedRef.current = true;
        onReady?.();
      }
    },
    [expectedLottieCount, onReady],
  );

  useImperativeHandle(
    ref,
    () => ({
      transitionToSection: (sectionIndex, options = {}) => {
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

        if (reduceMotionRef.current) {
          const visuals = [
            visualStageRef.current,
            floatingBackgroundRef.current,
            overlayRef.current,
          ].filter((element): element is HTMLDivElement => element !== null);

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
                  resolve();
                },
              })
              .to(visuals, {
                autoAlpha: 0,
                duration: (options.duration ?? 0.24) / 2,
                ease: "power1.out",
              })
              .call(() => timeline.progress(targetProgress).pause())
              .to(visuals, {
                autoAlpha: 1,
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
    }),
    [setCrowdPlaying],
  );

  useEffect(() => {
    const transition = transitionRef.current;
    const artboardLogo = artboardLogoRef.current;
    const floatingBackground = floatingBackgroundRef.current;
    const overlayLogo = overlayLogoRef.current;
    const sectionArt = sectionArtRef.current;
    const featured = featuredRef.current;
    const featuredLottie = featuredLottieRef.current;

    if (
      !transition ||
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

  return (
    <section ref={transitionRef} className="fixed inset-0 overflow-hidden">
      <div
        className="
          absolute
          inset-0
          overflow-hidden
          bg-[#f6ead7]
        "
      >
        <VisualStage
          visualStageRef={visualStageRef}
          artboardLogoRef={artboardLogoRef}
          crowd={crowd}
          featuredSlot={featuredSlot}
          featuredRef={featuredRef}
          featuredLottieRef={featuredLottieRef}
          onAnimationRef={handleCrowdAnimationRef}
          onLottieReady={handleLottieReady}
          sectionArtRef={sectionArtRef}
        />

        <FloatingBackground backgroundRef={floatingBackgroundRef} />

        {children}

        <ResponsiveOverlay
          overlayLogoRef={overlayLogoRef}
          overlayRef={overlayRef}
        />
      </div>
    </section>
  );
});
