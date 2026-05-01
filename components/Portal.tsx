"use client";

import { useState } from "react";

interface PortalProps {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  glowColor: string;
  delay: number;
  examples: string[];
}

export default function Portal({ icon, title, subtitle, color, glowColor, delay, examples }: PortalProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        animation: `fadeUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s both`,
        cursor: "pointer",
        position: "relative",
        zIndex: 10,
      }}
    >
      <div
        style={{
          position: "relative",
          borderRadius: "16px",
          overflow: "hidden",
          border: `1px solid ${hovered ? glowColor + "60" : "rgba(255,255,255,0.08)"}`,
          background: "linear-gradient(135deg, rgba(12,12,20,0.97) 0%, rgba(20,16,30,0.93) 100%)",
          boxShadow: hovered
            ? `0 0 30px ${glowColor}35, 0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 ${glowColor}25`
            : "0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
          transform: hovered ? "translateY(-6px) scale(1.03)" : "translateY(0) scale(1)",
          transition: "all 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* Top glow line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "1px",
          background: `linear-gradient(90deg, transparent, ${glowColor}70, transparent)`,
          opacity: hovered ? 1 : 0.3,
          transition: "opacity 0.3s ease",
        }} />

        {/* Ambient bg glow */}
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(circle at 30% 40%, ${glowColor}12 0%, transparent 60%)`,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.4s ease",
        }} />

        <div style={{ position: "relative", padding: "28px 32px" }}>
          {/* Icon */}
          <div style={{
            fontSize: "2.2rem",
            marginBottom: "14px",
            display: "inline-block",
            transform: hovered ? "scale(1.2) rotate(5deg)" : "scale(1) rotate(0deg)",
            transition: "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
            filter: hovered ? `drop-shadow(0 0 12px ${glowColor})` : "none",
          }}>
            {icon}
          </div>

          {/* Title */}
          <h3 style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.15rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            marginBottom: "4px",
            color: hovered ? glowColor : color,
            textShadow: hovered ? `0 0 20px ${glowColor}80` : "none",
            transition: "all 0.3s ease",
          }}>
            {title}
          </h3>

          {/* Subtitle */}
          <p style={{
            fontSize: "0.8rem",
            color: "rgba(245,240,232,0.45)",
            marginBottom: "16px",
            lineHeight: 1.5,
          }}>
            {subtitle}
          </p>

          {/* Tags */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {examples.map((ex) => (
              <span key={ex} style={{
                fontSize: "0.7rem",
                padding: "3px 10px",
                borderRadius: "99px",
                border: `1px solid ${glowColor}28`,
                color: glowColor + "bb",
                background: glowColor + "0e",
              }}>
                {ex}
              </span>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <div style={{
          position: "absolute", bottom: "16px", right: "20px",
          color: glowColor,
          fontSize: "1.1rem",
          opacity: hovered ? 1 : 0,
          transform: hovered ? "translateX(0)" : "translateX(-8px)",
          transition: "all 0.25s ease",
        }}>
          →
        </div>
      </div>
    </div>
  );
}
