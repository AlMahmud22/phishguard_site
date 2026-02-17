"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AutoSliderProps {
  children: ReactNode;
  direction?: "left" | "right";
  speed?: number;
  className?: string;
}

export default function AutoSlider({ 
  children, 
  direction = "left", 
  speed = 40,
  className = "" 
}: AutoSliderProps) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{
          x: direction === "left" ? [0, -1000] : [-1000, 0],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: speed,
            ease: "linear",
          },
        }}
      >
        <div className="flex gap-8">
          {children}
        </div>
        <div className="flex gap-8">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
