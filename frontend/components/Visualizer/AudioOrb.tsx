'use client';

import React, { useEffect, useRef } from 'react';

interface AudioOrbProps {
  state: 'idle' | 'listening' | 'thinking' | 'planning' | 'executing' | 'speaking';
  onClick?: () => void;
}

export const AudioOrb: React.FC<AudioOrbProps> = ({ state, onClick }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = 45;

      // Color scheme based on agent state
      let mainColor = 'rgba(6, 182, 212, ';   // Cyan
      let secondaryColor = 'rgba(16, 185, 129, '; // Emerald

      if (state === 'listening') {
        mainColor = 'rgba(0, 242, 254, ';
        secondaryColor = 'rgba(5, 255, 161, ';
      } else if (state === 'speaking') {
        mainColor = 'rgba(168, 85, 247, '; // Purple
        secondaryColor = 'rgba(59, 130, 246, '; // Blue
      } else if (state === 'executing' || state === 'planning') {
        mainColor = 'rgba(16, 185, 129, ';
        secondaryColor = 'rgba(6, 182, 212, ';
      }

      // Outer Pulsing Glow
      const glowGradient = ctx.createRadialGradient(
        centerX, centerY, baseRadius * 0.5,
        centerX, centerY, baseRadius * 2
      );
      glowGradient.addColorStop(0, `${mainColor}0.5)`);
      glowGradient.addColorStop(0.5, `${secondaryColor}0.2)`);
      glowGradient.addColorStop(1, 'transparent');

      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Rotating sci-fi orbital rings
      const ringCount = 3;
      for (let r = 0; r < ringCount; r++) {
        ctx.beginPath();
        const currentAngle = angle * (r % 2 === 0 ? 1 : -1) * (0.8 + r * 0.3);
        const ringRadius = baseRadius + r * 14 + (state === 'listening' ? Math.sin(angle * 4) * 6 : 0);

        ctx.ellipse(centerX, centerY, ringRadius, ringRadius * 0.75, currentAngle, 0, Math.PI * 2);
        ctx.strokeStyle = `${mainColor}${0.3 + (r * 0.2)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Orbiting particle dot
        const dotX = centerX + Math.cos(currentAngle + r * 1.5) * ringRadius;
        const dotY = centerY + Math.sin(currentAngle + r * 1.5) * (ringRadius * 0.75);
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
        ctx.fillStyle = `${secondaryColor}0.9)`;
        ctx.shadowColor = '#00f2fe';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Central Energy Core
      const coreGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, baseRadius
      );
      coreGradient.addColorStop(0, '#ffffff');
      coreGradient.addColorStop(0.3, `${mainColor}0.9)`);
      coreGradient.addColorStop(0.8, `${secondaryColor}0.6)`);
      coreGradient.addColorStop(1, 'transparent');

      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      const pulseSize = baseRadius + (state === 'speaking' || state === 'listening' ? Math.sin(angle * 8) * 8 : Math.sin(angle * 2) * 3);
      ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
      ctx.fill();

      // Audio waveform bars if active
      if (state === 'speaking' || state === 'listening') {
        const barCount = 16;
        for (let b = 0; b < barCount; b++) {
          const theta = (b / barCount) * Math.PI * 2 + angle;
          const amp = 8 + Math.sin(angle * 6 + b * 0.8) * 12;
          const x1 = centerX + Math.cos(theta) * (baseRadius + 16);
          const y1 = centerY + Math.sin(theta) * (baseRadius + 16);
          const x2 = centerX + Math.cos(theta) * (baseRadius + 16 + amp);
          const y2 = centerY + Math.sin(theta) * (baseRadius + 16 + amp);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = `${mainColor}0.8)`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      angle += 0.025;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state]);

  return (
    <div className="relative flex flex-col items-center justify-center cursor-pointer group" onClick={onClick}>
      <canvas
        ref={canvasRef}
        width={220}
        height={220}
        className="transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute bottom-2 px-3 py-1 rounded-full bg-slate-900/90 border border-cyan-500/30 text-[11px] font-mono uppercase tracking-widest text-cyan-300 shadow-md">
        {state === 'idle' && '• READY'}
        {state === 'listening' && '🎙️ LISTENING...'}
        {state === 'thinking' && '🧠 THINKING...'}
        {state === 'planning' && '📋 PLANNING...'}
        {state === 'executing' && '⚙️ CONTROLLING WINDOWS...'}
        {state === 'speaking' && '🔊 SPEAKING...'}
      </div>
    </div>
  );
};
