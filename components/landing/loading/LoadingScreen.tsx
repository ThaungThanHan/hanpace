import { LottieAnimation } from "@/components/animation/LottieAnimation";
import { LoadingText } from "@/components/landing/loading/LoadingText";

type LoadingScreenProps = {
  label?: string;
  className?: string;
};

export function LoadingScreen({
  label = "Loading",
  className = "",
}: LoadingScreenProps) {
  return (
    <div
      className={`flex min-h-screen w-full flex-col items-center justify-center gap-8 bg-[#f6ead7] px-6 text-[#183c2e] ${className}`}
      role="status"
      aria-live="polite"
    >
      <LottieAnimation
        lottieName="loading.json"
        size={320}
        speed={1}
        ariaLabel="Loading animation"
      />
      <LoadingText label={label} />
    </div>
  );
}
