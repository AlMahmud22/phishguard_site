"use client";

import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { type Container, type ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";

interface ParticlesBackgroundProps {
  variant?: "dots" | "waves" | "snow" | "network" | "bubbles";
  color?: string;
}

export default function ParticlesBackground({ 
  variant = "dots",
  color = "#3b82f6"
}: ParticlesBackgroundProps) {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = async (container?: Container): Promise<void> => {
    // Particles loaded successfully
  };

  const options: ISourceOptions = useMemo(() => {
    const baseConfig = {
      background: {
        color: {
          value: "transparent",
        },
      },
      fpsLimit: 120,
      interactivity: {
        events: {
          onClick: {
            enable: true,
            mode: "push",
          },
          onHover: {
            enable: true,
            mode: "repulse",
          },
        },
        modes: {
          push: {
            quantity: 4,
          },
          repulse: {
            distance: 100,
            duration: 0.4,
          },
        },
      },
      particles: {},
      detectRetina: true,
    };

    switch (variant) {
      case "waves":
        return {
          ...baseConfig,
          particles: {
            number: { value: 80, density: { enable: true, width: 800, height: 800 } },
            color: { value: color },
            shape: { type: "circle" },
            opacity: { value: 0.15 },
            size: { value: { min: 2, max: 4 } },
            move: {
              enable: true,
              speed: 2,
              direction: "none",
              random: false,
              straight: false,
              outModes: "out",
              attract: { enable: true, rotateX: 600, rotateY: 1200 },
            },
          },
        };

      case "snow":
        return {
          ...baseConfig,
          particles: {
            number: { value: 100 },
            color: { value: color },
            shape: { type: "circle" },
            opacity: { value: 0.2 },
            size: { value: { min: 2, max: 6 } },
            move: {
              enable: true,
              speed: 1,
              direction: "bottom",
              random: true,
              straight: false,
              outModes: "out",
            },
          },
        };

      case "network":
        return {
          ...baseConfig,
          particles: {
            number: { value: 60 },
            color: { value: color },
            shape: { type: "circle" },
            opacity: { value: 0.2 },
            size: { value: { min: 2, max: 3 } },
            links: {
              enable: true,
              distance: 150,
              color: color,
              opacity: 0.15,
              width: 1,
            },
            move: {
              enable: true,
              speed: 1.5,
              direction: "none",
              random: false,
              straight: false,
              outModes: "bounce",
            },
          },
        };

      case "bubbles":
        return {
          ...baseConfig,
          particles: {
            number: { value: 40 },
            color: { value: color },
            shape: { type: "circle" },
            opacity: { value: { min: 0.05, max: 0.15 } },
            size: { value: { min: 10, max: 50 } },
            move: {
              enable: true,
              speed: 1,
              direction: "top",
              random: true,
              straight: false,
              outModes: "out",
            },
          },
        };

      default: // dots
        return {
          ...baseConfig,
          particles: {
            number: { value: 50 },
            color: { value: color },
            shape: { type: "circle" },
            opacity: { value: 0.2 },
            size: { value: { min: 2, max: 4 } },
            move: {
              enable: true,
              speed: 1,
              direction: "none",
              random: true,
              straight: false,
              outModes: "out",
            },
          },
        };
    }
  }, [variant, color]);

  if (!init) {
    return null;
  }

  return (
    <Particles
      id={`tsparticles-${variant}`}
      particlesLoaded={particlesLoaded}
      options={options}
      className="absolute inset-0 pointer-events-none"
    />
  );
}
