"use client";

import { motion, useReducedMotion } from "motion/react";

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
  const reduceMotion = useReducedMotion() === true;
  const cleanLabel = label.replace(/\.+$/, "");
  const dots = Array.from({ length: dotCount }, (_, index) => index);
  const dotStart = 0.7;

  return (
    <motion.p
      className={`text-base font-medium uppercase tracking-[0.22em] ${className}`}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.92, y: 18 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
      }}
      transition={
        reduceMotion ? { duration: 0 } : { duration: 0.75, ease: "easeOut" }
      }
    >
      <span>{cleanLabel}</span>
      {dots.map((dot) => (
        <motion.span
          key={dot}
          aria-hidden="true"
          className="inline-block"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.35, y: 10 }}
          animate={{
            opacity: 1,
            scale: reduceMotion ? 1 : [0.35, 1.25, 1],
            y: 0,
          }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  delay: dotStart + dot * 0.16,
                  duration: 0.38,
                  ease: "easeOut",
                }
          }
        >
          .
        </motion.span>
      ))}
    </motion.p>
  );
}
