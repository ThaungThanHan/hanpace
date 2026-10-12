import { LottieAnimation } from "@/components/animation/LottieAnimation";
import { LoadingText } from "@/components/landing/loading/LoadingText";

type LoadingScreenProps = {
  label?: string;
};

export function LoadingScreen({
  label = "Loading"
}: LoadingScreenProps) {
  return (
    <div
      className={`flex min-h-screen w-full flex-col items-center justify-center bg-[#f6ead7] px-6 text-[#183c2e]`}
      role="status"
      aria-live="polite"
    >
      <LottieAnimation
        lottieName="walking.json"
        size={320}
        ariaLabel="Loading animation"
      />
      <LoadingText label={label} />
    </div>
  );
}
