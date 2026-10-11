"use client";

import { motion } from "motion/react";

type LoadingTextProps = {
  label?: string;
  dotCount?: number;
  className?: string;
};

export function LoadingText({
  label = "Loading",
  dotCount = 3,
  className = "",
}: LoadingTextProps) {
  const cleanLabel = label.replace(/\.+$/, "");
  const dots = Array.from({ length: dotCount }, (_, index) => index);
  const dotStart = 0.7;

  return (
    <motion.p
      className={`text-base font-medium uppercase tracking-[0.22em] ${className}`}
      initial={{ opacity: 0, scale: 0.92, y: 18 }}
      animate={{
        filter: "blur(0px)",
        opacity: 1,
        scale: 1,
        y: 0,
      }}
      transition={{
        duration: 0.75,
        ease: "easeOut",
      }}
    >
      <span>{cleanLabel}</span>
      {dots.map((dot) => (
        <motion.span
          key={dot}
          aria-hidden="true"
          className="inline-block"
          initial={{ opacity: 0, scale: 0.35, y: 10 }}
          animate={{
            opacity: 1,
            scale: [0.35, 1.25, 1],
            y: 0,
          }}
          transition={{
            delay: dotStart + dot * 0.16,
            duration: 0.38,
            ease: "easeOut",
          }}
        >
          .
        </motion.span>
      ))}
    </motion.p>
  );
}
