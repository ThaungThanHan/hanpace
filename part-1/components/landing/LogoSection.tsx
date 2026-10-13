"use client";

import { forwardRef, useImperativeHandle, useMemo, type ReactNode } from "react";
import { generateCrowd } from "./logo/crowd";
import { FloatingBackground } from "./logo/FloatingBackground";
import { ResponsiveOverlay } from "./logo/ResponsiveOverlay";
import { VisualStage } from "./logo/VisualStage";
import { useCrowdPlayback } from "./logo/useCrowdPlayback";
import { useSceneAnimation, type LogoSectionHandle } from "./logo/useSceneAnimation";

export type { LogoSectionHandle } from "./logo/useSceneAnimation";

type LogoSectionProps = {
  children?: ReactNode;
  onReady?: () => void;
};

export const LogoSection = forwardRef<LogoSectionHandle, LogoSectionProps>(
  function LogoSection({ children, onReady }, ref) {
    const { crowd, featuredSlot } = useMemo(() => generateCrowd({ seed: 12345 }), []);
    const { handleCrowdAnimationRef, handleLottieSettled, setCrowdPlaying } = useCrowdPlayback(
      crowd.length + 1,
      onReady,
    );
    const { refs, transitionToSection } = useSceneAnimation(featuredSlot, setCrowdPlaying);

    useImperativeHandle(ref, () => ({ transitionToSection }), [transitionToSection]);

    return (
      <section ref={refs.transitionRef} className="fixed inset-0 overflow-hidden">
        <div ref={refs.sceneFadeRef} className="absolute inset-0 overflow-hidden bg-[#f6ead7]">
          <VisualStage
            artboardLogoRef={refs.artboardLogoRef}
            crowd={crowd}
            featuredSlot={featuredSlot}
            featuredRef={refs.featuredRef}
            featuredLottieRef={refs.featuredLottieRef}
            onAnimationRef={handleCrowdAnimationRef}
            onLottieSettled={handleLottieSettled}
            sectionArtRef={refs.sectionArtRef}
          />

          <FloatingBackground backgroundRef={refs.floatingBackgroundRef} />

          <ResponsiveOverlay overlayLogoRef={refs.overlayLogoRef} />
        </div>
        {children}
      </section>
    );
  },
);
