"use client";

import { useMemo } from "react";
import { LottieAnimation } from "@/components/animation/LottieAnimation";

const SCENE_WIDTH = 1920;
const SCENE_HEIGHT = 1080;
const FEATURED_ROW = 2;
const FEATURED_INDEX = 3;

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
    const startX = SCENE_WIDTH / 2 - totalWidth / 2 + row.xOffset;

    for (let i = 0; i < row.count; i += 1) {
      const x = startX + i * row.spacing;
      const y = row.y;
      const size = row.baseSize * (0.95 + random() * 0.1);
      const clampedX = clamp(x, 40, SCENE_WIDTH - 40);
      const clampedY = clamp(y, 40, SCENE_HEIGHT - 40);
      const item = {
        id: `character-${rowIndex}-${i}`,
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

function CrowdCharacter({
  item,
  featured = false,
}: {
  item: CrowdItem;
  featured?: boolean;
}) {
  return (
    <div
      className={featured ? "featured-character absolute" : "absolute"}
      style={{
        aspectRatio: "1 / 1",
        left: `${(item.x / SCENE_WIDTH) * 100}%`,
        pointerEvents: "none",
        top: `${(item.y / SCENE_HEIGHT) * 100}%`,
        transform: "translate3d(-50%, -50%, 0)",
        transformOrigin: "center center",
        width: `${(item.size / SCENE_WIDTH) * 100}%`,
        zIndex: item.z,
      }}
    >
      <LottieAnimation
        lottieName="walking.json"
        speed={item.speed}
        startOffset={item.startOffset}
        ariaLabel={
          featured ? "Featured character animation" : "Decorative character animation"
        }
        className="h-full w-full pointer-events-none"
      />
    </div>
  );
}

function AnimatedCrowdBackground() {
  const { crowd, featuredSlot } = useMemo(
    () => generateCrowd({ seed: 12345 }),
    [],
  );
  const sortedCrowd = useMemo(
    () => [...crowd].sort((a, b) => a.z - b.z),
    [crowd],
  );

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="absolute"
        style={{
          aspectRatio: "16 / 9",
          contain: "layout paint",
          left: "50%",
          overflow: "visible",
          pointerEvents: "none",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "max(100vw, calc(100dvh * 16 / 9))",
        }}
      >
        {sortedCrowd.map((item) => (
          <CrowdCharacter key={item.id} item={item} />
        ))}
        <CrowdCharacter item={featuredSlot} featured />
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section
      className="
        relative
        h-screen
        w-screen
        overflow-hidden
        bg-[#f6ead7]
      "
    >
      <div className="absolute inset-0 bg-[#f6ead7]" aria-hidden="true" />

      <AnimatedCrowdBackground />

      <div className="pointer-events-none absolute inset-0 z-20">
        <div
          className="
            absolute
            left-3
            top-3
            sm:left-4
            sm:top-4
            md:left-6
            md:top-4
          "
        >
          <span
            className="
              block
              font-black
              uppercase
              leading-[0.82]
              tracking-[-0.08em]
              text-[#fff5d9]
              drop-shadow-[0_3px_0_rgba(21,67,91,0.18)]
            "
            style={{
              fontSize: "clamp(2.5rem, 5vw, 7.3rem)",
              WebkitTextStroke: "2px rgba(40,93,133,0.7)",
              textShadow: "0 3px 0 rgba(24,60,46,0.12)",
            }}
          >
            Fluffy <span className="text-[#0d5eff]">HÜGS</span>
          </span>
        </div>

        <div
          className="
            pointer-events-auto
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
          <button
            type="button"
            aria-label="Discord"
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              border-2
              border-[#0f172a]
              bg-[#f7e7d0]
              text-[0.7rem]
              font-black
              text-[#0f172a]
              shadow-[0_3px_0_rgba(15,23,42,0.2)]
              transition-transform
              hover:scale-105
              sm:h-11
              sm:w-11
              sm:text-[0.8rem]
              md:h-12
              md:w-12
            "
          >
            D
          </button>

          <button
            type="button"
            aria-label="Instagram"
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              border-2
              border-[#0f172a]
              bg-[#f7e7d0]
              text-[0.7rem]
              font-black
              text-[#0f172a]
              shadow-[0_3px_0_rgba(15,23,42,0.2)]
              transition-transform
              hover:scale-105
              sm:h-11
              sm:w-11
              sm:text-[0.8rem]
              md:h-12
              md:w-12
            "
          >
            I
          </button>

          <button
            type="button"
            aria-label="X"
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              border-2
              border-[#0f172a]
              bg-[#f7e7d0]
              text-[0.7rem]
              font-black
              text-[#0f172a]
              shadow-[0_3px_0_rgba(15,23,42,0.2)]
              transition-transform
              hover:scale-105
              sm:h-11
              sm:w-11
              sm:text-[0.8rem]
              md:h-12
              md:w-12
            "
          >
            X
          </button>
        </div>

        <div
          className="
            pointer-events-auto
            absolute
            bottom-4
            right-5
            sm:bottom-5
            sm:right-6
            md:bottom-7
            md:right-8
          "
        >
          <button
            type="button"
            className="
              text-[0.7rem]
              font-medium
              uppercase
              tracking-[0.16em]
              text-[#183c2e]
              underline-offset-4
              hover:underline
              sm:text-[0.75rem]
              md:text-[0.82rem]
            "
          >
            view collection
          </button>
        </div>
      </div>
    </section>
  );
}
