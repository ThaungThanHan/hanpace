"use client";

import { useCallback, useMemo, useState, type RefObject } from "react";
import { LottieAnimation, type LottieAnimationHandle } from "@/components/animation/LottieAnimation";
import { ArtboardItem, ArtboardLogo } from "./SceneArtwork";
import type { CrowdItem, LottieLoadStatus } from "./crowd";
import { FEATURED_HOVER_SPEED_RATIO } from "./sceneConfig";

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
  onSettled,
}: {
  featuredLottieRef?: RefObject<LottieAnimationHandle | null>;
  featuredRef?: RefObject<HTMLDivElement | null>;
  item: CrowdItem;
  onAnimationRef: (id: string, animation: LottieAnimationHandle | null) => void;
  onSettled?: (id: string, status: LottieLoadStatus) => void;
}) {
  const [animationFailed, setAnimationFailed] = useState(false);
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
      <div 
      onMouseOver={() => {
        featuredLottieRef?.current?.setSpeed(item.speed * 2)
      }}
      data-crowd-row={featured ? undefined : item.rowIndex} className="h-full w-full">
        {animationFailed ? (
          // Show the first frame of the existing ten-frame standing sprite sheet.
          <div
            aria-hidden="true"
            className="mx-auto h-full w-[30%] bg-[url('/assets/images/standing_2.png')] bg-[length:1000%_100%] bg-left-top bg-no-repeat"
          />
        ) : <LottieAnimation
          ref={featured ? featuredLottieRef : handleAnimationRef}
          lottieName="walking.json"
          speed={item.speed}
          startOffset={item.startOffset}
          onReady={() => onSettled?.(item.id, "ready")}
          onError={() => {
            setAnimationFailed(true);
            onSettled?.(item.id, "error");
          }}
          ariaLabel={
            featured
              ? "Featured character animation"
              : "Decorative character animation"
          }
          className="h-full w-full pointer-events-none"
        />}
      </div>
    </ArtboardItem>
  );
}

export function VisualStage({
  crowd,
  artboardLogoRef,
  featuredLottieRef,
  featuredRef,
  featuredSlot,
  onAnimationRef,
  onLottieSettled,
  sectionArtRef,
}: {
  artboardLogoRef: RefObject<HTMLDivElement | null>;
  crowd: CrowdItem[];
  featuredLottieRef: RefObject<LottieAnimationHandle | null>;
  featuredRef: RefObject<HTMLDivElement | null>;
  featuredSlot: CrowdItem;
  onAnimationRef: (id: string, animation: LottieAnimationHandle | null) => void;
  onLottieSettled?: (id: string, status: LottieLoadStatus) => void;
  sectionArtRef: RefObject<HTMLDivElement | null>;
}) {
  const sortedCrowd = useMemo(
    () => [...crowd].sort((a, b) => a.z - b.z),
    [crowd],
  );

  return (
    <div
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
            onSettled={onLottieSettled}
          />
        ))}
        <CrowdCharacter
          item={featuredSlot}
          featuredRef={featuredRef}
          featuredLottieRef={featuredLottieRef}
          onAnimationRef={onAnimationRef}
          onSettled={onLottieSettled}
        />
      </div>
    </div>
  );
}
