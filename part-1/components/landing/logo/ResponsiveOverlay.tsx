import type { ReactNode, RefObject } from "react";
import Image from "next/image";
import { OverlayLogo } from "./SceneArtwork";

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

export function ResponsiveOverlay({
  overlayLogoRef,
}: {
  overlayLogoRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
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
