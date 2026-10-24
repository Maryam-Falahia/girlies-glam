"use client";

import { useEffect, useRef } from "react";

const COLORS = ["rgba(239,109,160,", "rgba(178,125,190,", "rgba(232,176,75,"];

export function BackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let frameId = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = Math.max(window.innerHeight, document.body.scrollHeight);
    };
    resize();
    window.addEventListener("resize", resize);

    const sparkles = Array.from({ length: 52 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vy: Math.random() * 0.28 + 0.08,
      r: Math.random() * 5.5 + 3.5,
      a: Math.random() * Math.PI * 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * Math.PI,
    }));

    const drawSpark = (x: number, y: number, r: number, rot: number, color: string, alpha: number) => {
      context.save();
      context.translate(x, y);
      context.rotate(rot);
      context.beginPath();
      context.moveTo(0, -r);
      context.quadraticCurveTo(r * 0.25, -r * 0.25, r, 0);
      context.quadraticCurveTo(r * 0.25, r * 0.25, 0, r);
      context.quadraticCurveTo(-r * 0.25, r * 0.25, -r, 0);
      context.quadraticCurveTo(-r * 0.25, -r * 0.25, 0, -r);
      context.closePath();
      context.fillStyle = color + alpha + ")";
      context.fill();
      context.restore();
    };

    const frame = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      sparkles.forEach((spark) => {
        spark.y -= spark.vy;
        spark.a += 0.035;
        if (spark.y < -10) {
          spark.y = canvas.height + 10;
          spark.x = Math.random() * canvas.width;
        }
        drawSpark(spark.x, spark.y, spark.r, spark.rot + spark.a * 0.1, spark.color, Math.max(0.35 + Math.sin(spark.a) * 0.3, 0.05));
      });
      frameId = requestAnimationFrame(frame);
    };
    frame();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return <canvas id="bg-canvas" ref={canvasRef} />;
}
