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
const WHEEL_THRESHOLD = 20;
const SWIPE_THRESHOLD = 48;
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
  const touchStartY = useRef<number | null>(null);

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
    if (!navigationEnabled) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      if (Math.abs(event.deltaY) < WHEEL_THRESHOLD) {
        return;
      }

      goToSection(activeSectionRef.current + (event.deltaY > 0 ? 1 : -1));
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => window.removeEventListener("wheel", handleWheel);
  }, [goToSection, navigationEnabled]);

  const handleTouchStart = (event: TouchEvent<HTMLElement>) => {
    touchStartY.current = event.changedTouches[0]?.clientY ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLElement>) => {
    if (touchStartY.current === null) {
      return;
    }

    const touchEndY = event.changedTouches[0]?.clientY;

    if (touchEndY === undefined) {
      touchStartY.current = null;
      return;
    }

    const distance = touchStartY.current - touchEndY;
    touchStartY.current = null;

    if (Math.abs(distance) < SWIPE_THRESHOLD) {
      return;
    }

    goToSection(activeSectionRef.current + (distance > 0 ? 1 : -1));
  };

  return (
    <main
      className="fixed inset-0 overflow-hidden bg-[#f6ead7]"
      onTouchEnd={handleTouchEnd}
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
