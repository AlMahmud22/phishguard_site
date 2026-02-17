"use client";

import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";

interface LordIconProps {
  src: string;
  trigger?: "hover" | "click" | "loop" | "morph";
  colors?: {
    primary?: string;
    secondary?: string;
  };
  size?: number;
  delay?: number;
  className?: string;
}

// Map lordicon URLs to lucide-react icons
const iconMap: Record<string, keyof typeof LucideIcons> = {
  "ftnxelbg": "Shield",
  "xzybfbcm": "Target",
  "kiynvdns": "Zap",
  "msoeawqm": "Search",
  "wzrwaorf": "Bot",
  "egiwmiit": "Clock",
  "ggvdxqyx": "Globe",
  "qhgmphtg": "Download",
  "jdalicnn": "ShieldAlert",
  "lomfljuq": "Sparkles",
};

export default function LordIcon({
  src,
  trigger = "loop",
  colors = { primary: "#2563eb", secondary: "#1d4ed8" },
  size = 64,
  delay = 0,
  className = "",
}: LordIconProps) {
  // Extract icon code from URL
  const iconCode = src.match(/([a-z]+)\.json$/)?.[1] || "ftnxelbg";
  const IconComponent = LucideIcons[iconMap[iconCode] || "Shield"] as any;

  // Animation based on trigger
  const getAnimation = () => {
    if (trigger === "loop") {
      return {
        scale: [1, 1.1, 1],
        rotate: [0, 5, -5, 0],
      };
    } else if (trigger === "morph") {
      return {
        scale: [1, 1.2, 1],
      };
    }
    return {};
  };

  const getTransition = () => {
    if (trigger === "loop" || trigger === "morph") {
      return {
        duration: trigger === "loop" ? 2 : 1.5,
        repeat: Infinity,
        ease: "easeInOut" as const,
        delay: delay / 1000,
      };
    }
    return { delay: delay / 1000 };
  };

  return (
    <motion.div
      className={className}
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1, ...getAnimation() }}
      whileHover={trigger === "hover" ? { scale: 1.2, rotate: 10 } : undefined}
      transition={getTransition()}
    >
      <IconComponent
        size={size * 0.8}
        color={colors.primary}
        strokeWidth={2}
      />
    </motion.div>
  );
}
