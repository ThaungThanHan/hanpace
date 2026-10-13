import type { CSSProperties, ReactNode, RefObject } from "react";
import { ARTBOARD_WIDTH, ARTBOARD_HEIGHT, ARTBOARD_LOGO } from "./sceneConfig";

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

function toXPercent(x: number) {
  return `${(x / ARTBOARD_WIDTH) * 100}%`;
}

function toYPercent(y: number) {
  return `${(y / ARTBOARD_HEIGHT) * 100}%`;
}

export function ArtboardItem({
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

export function ArtboardLogo({
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

export function OverlayLogo({
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
