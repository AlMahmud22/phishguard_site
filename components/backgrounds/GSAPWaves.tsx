"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface GSAPWavesProps {
  colors?: string[];
  speed?: number;
}

export default function GSAPWaves({ 
  colors = ["#3b82f6", "#8b5cf6", "#06b6d4"],
  speed = 3
}: GSAPWavesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    class Wave {
      y: number;
      length: number;
      amplitude: number;
      frequency: number;
      color: string;
      opacity: number;

      constructor(y: number, length: number, amplitude: number, frequency: number, color: string, opacity: number) {
        this.y = y;
        this.length = length;
        this.amplitude = amplitude;
        this.frequency = frequency;
        this.color = color;
        this.opacity = opacity;
      }

      draw(ctx: CanvasRenderingContext2D, time: number, canvasWidth: number, canvasHeight: number) {
        ctx.beginPath();
        ctx.moveTo(0, canvasHeight);

        for (let x = 0; x <= canvasWidth; x += 10) {
          const y = this.y + Math.sin(x * this.frequency + time) * this.amplitude;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(canvasWidth, canvasHeight);
        ctx.closePath();

        const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
        gradient.addColorStop(0, this.color + this.opacity.toString(16).padStart(2, '0'));
        gradient.addColorStop(1, this.color + '00');
        
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    }

    const waves = colors.map((color, i) => new Wave(
      canvas.height * 0.4 + i * 50,
      0.015 + i * 0.002,
      30 + i * 10,
      0.01 + i * 0.002,
      color,
      Math.floor(20 - i * 3)
    ));

    let time = 0;
    let animationId: number;
    
    const animate = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      waves.forEach(wave => {
        if (canvas) {
          wave.draw(ctx, time, canvas.width, canvas.height);
        }
      });

      time += 0.02 * speed;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [colors, speed]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.4 }}
    />
  );
}
