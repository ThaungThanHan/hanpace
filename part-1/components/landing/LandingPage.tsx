"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type TouchEvent,
} from "react";
import {
  LogoSection,
  type LogoSectionHandle,
} from "@/components/landing/LogoSection";

const SECTION_NAMES = ["hero", "logo"] as const;
const WHEEL_THRESHOLD = 20; // pixels
const WHEEL_IDLE_TIMEOUT = 180;
const SWIPE_THRESHOLD = 48;
const SWIPE_AXIS_RATIO = 1.25;
const SECTION_DURATION = 1.5;
const REDUCED_SECTION_DURATION = 0.24;

type LandingPageProps = {
  navigationEnabled: boolean;
  onReady?: () => void;
};

function SectionIndicator({
  activeSection,
  onSelect,
}: {
  activeSection: number;
  onSelect: (index: number) => void;
}) {
  return (
    <nav
      className="pointer-events-auto absolute right-4 top-1/2 z-[90] flex -translate-y-1/2 flex-col gap-2 sm:right-5 md:right-7"
      aria-label="Section navigation"
    >
      {SECTION_NAMES.map((name, index) => (
        <button
          key={name}
          type="button"
          aria-label={`Go to ${name}`}
          aria-current={activeSection === index ? "true" : undefined}
          onClick={() => onSelect(index)}
          className={[
            "h-2.5 w-2.5 cursor-pointer rounded-full border border-[#183c2e]/50 transition",
            activeSection === index
              ? "bg-[#183c2e]"
              : "bg-[#fff5d9]/70 hover:bg-[#fff5d9]",
          ].join(" ")}
        />
      ))}
    </nav>
  );
}

export function LandingPage({ navigationEnabled, onReady }: LandingPageProps) {
  const [activeSection, setActiveSection] = useState(0);
  const logoSectionRef = useRef<LogoSectionHandle>(null);
  const activeSectionRef = useRef(0);
  const isTransitioning = useRef(false);
  const reduceMotionRef = useRef(false);
  const wheelGesture = useRef({ distance: 0, lastEventTime: 0 });
  const touchStart = useRef<{ identifier: number; x: number; y: number } | null>(null);

  const goToSection = useCallback(
    (nextIndex: number) => {
      const currentIndex = activeSectionRef.current;

      if (
        !navigationEnabled ||
        isTransitioning.current ||
        nextIndex < 0 ||
        nextIndex >= SECTION_NAMES.length ||
        nextIndex === currentIndex
      ) {
        return;
      }

      isTransitioning.current = true;
      wheelGesture.current.distance = 0;
      touchStart.current = null;
      activeSectionRef.current = nextIndex;
      setActiveSection(nextIndex);

      const duration = reduceMotionRef.current
        ? REDUCED_SECTION_DURATION
        : SECTION_DURATION;

      void (
        logoSectionRef.current?.transitionToSection(nextIndex, {
          duration,
        }) ?? Promise.resolve()
      ).finally(() => {
        isTransitioning.current = false;
      });
    },
    [navigationEnabled],
  );

  useEffect(() => {
    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    reduceMotionRef.current = motionPreference.matches;

    const handleMotionChange = () => {
      reduceMotionRef.current = motionPreference.matches;
    };
    motionPreference.addEventListener("change", handleMotionChange);

    return () => {
      motionPreference.removeEventListener("change", handleMotionChange);
    };
  }, []);

  useEffect(() => {
    wheelGesture.current.distance = 0;
    touchStart.current = null;
    if (!navigationEnabled) {
      return;
    }

    const rootStyle = window.getComputedStyle(document.documentElement);
    const lineHeight = Number.parseFloat(rootStyle.lineHeight)
      || Number.parseFloat(rootStyle.fontSize) * 1.2
      || 16;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      const gesture = wheelGesture.current;
      if (isTransitioning.current) {
        gesture.distance = 0;
        return;
      }

      // Read deltaMode before deltaY: wheel units can be pixels, lines, or pages.
      const unit = event.deltaMode === 1 ? lineHeight
        : event.deltaMode === 2 ? window.innerHeight : 1;
      const distance = event.deltaY * unit;
      if (distance === 0) return;

      if (
        event.timeStamp - gesture.lastEventTime > WHEEL_IDLE_TIMEOUT ||
        Math.sign(distance) !== Math.sign(gesture.distance)
      ) {
        gesture.distance = 0;
      }
      gesture.distance += distance;
      gesture.lastEventTime = event.timeStamp;

      if (Math.abs(gesture.distance) < WHEEL_THRESHOLD) return;

      const direction = gesture.distance > 0 ? 1 : -1;
      gesture.distance = 0;
      goToSection(activeSectionRef.current + direction);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => window.removeEventListener("wheel", handleWheel);
  }, [goToSection, navigationEnabled]);

  const handleTouchStart = (event: TouchEvent<HTMLElement>) => {
    touchStart.current = null;
    if (!navigationEnabled || isTransitioning.current || event.touches.length !== 1) return;

    const touch = event.touches[0];
    touchStart.current = { identifier: touch.identifier, x: touch.clientX, y: touch.clientY };
  };

  const cancelTouch = () => {
    touchStart.current = null;
  };

  const handleTouchMove = (event: TouchEvent<HTMLElement>) => {
    if (event.touches.length !== 1 || event.touches[0].identifier !== touchStart.current?.identifier) {
      cancelTouch();
    }
  };

  const handleTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const start = touchStart.current;
    cancelTouch();
    if (!start || event.touches.length !== 0 || event.changedTouches.length !== 1) return;

    const touch = event.changedTouches[0];
    if (touch.identifier !== start.identifier) return;

    const distance = start.y - touch.clientY;
    const horizontalDistance = Math.abs(start.x - touch.clientX);
    if (
      Math.abs(distance) < SWIPE_THRESHOLD ||
      Math.abs(distance) <= horizontalDistance * SWIPE_AXIS_RATIO
    ) {
      return;
    }

    goToSection(activeSectionRef.current + (distance > 0 ? 1 : -1));
  };

  return (
    <main
      className="fixed inset-0 overflow-hidden bg-[#f6ead7]"
      onTouchCancel={cancelTouch}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
    >
      <LogoSection
        ref={logoSectionRef}
        onReady={onReady}
      >
        <h1 className="sr-only">Pace</h1>
        <SectionIndicator activeSection={activeSection} onSelect={goToSection} />
      </LogoSection>
    </main>
  );
}
