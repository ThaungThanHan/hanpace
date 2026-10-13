"use client";

import { useEffect, useRef, type RefObject } from "react";
import Image from "next/image";
import gsap from "gsap";
import { FLOATING_ASSETS } from "./sceneConfig";

export function FloatingBackground({
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
