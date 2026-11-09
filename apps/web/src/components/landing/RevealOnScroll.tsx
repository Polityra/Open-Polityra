/* eslint-disable react-hooks/purity */
"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "scale";
  distance?: string;
  duration?: number;
  rootMargin?: string;
  className?: string;
  once?: boolean;
}

const stylesId = "polityra-reveal-styles";

function injectKeyframes() {
  if (typeof document === "undefined" || document.getElementById(stylesId)) return;
  const style = document.createElement("style");
  style.id = stylesId;
  style.textContent = `
    @keyframes polityra-fade-up {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes polityra-fade-down {
      from { opacity: 0; transform: translateY(-24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes polityra-fade-left {
      from { opacity: 0; transform: translateX(24px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes polityra-fade-right {
      from { opacity: 0; transform: translateX(-24px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes polityra-scale-in {
      from { opacity: 0; transform: scale(0.92); }
      to   { opacity: 1; transform: scale(1); }
    }
    .reveal-Elm {
      opacity: 0;
      transition: opacity 0.6s ease, transform 0.6s ease;
    }
    .reveal-Elm.revealed { opacity: 1; transform: none !important; }
    @supports (animation-timeline: scroll()) {
      .scroll-glow {
        animation: glow-pulse 2s ease-in-out infinite alternate;
      }
      @keyframes glow-pulse {
        from { filter: brightness(1); }
        to   { filter: brightness(1.08); }
      }
    }
  `;
  document.head.appendChild(style);
}

export function RevealOnScroll({
  children,
  delay = 0,
  direction = "up",
  distance = "24px",
  duration = 600,
  rootMargin = "0px",
  className = "",
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    injectKeyframes();
    const el = ref.current;
    if (!el) return;

    const timer = setTimeout(() => setRevealed(true), delay);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          setRevealed(true);
          if (once) observer.unobserve(el);
        }
      },
      { threshold: once ? 0.15 : 0.3, rootMargin },
    );

    observer.observe(el);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [delay, once, rootMargin]);

  const transformDir = (() => {
    if (direction === "up") return `translateY(${distance})`;
    if (direction === "down") return `translateY(-${distance})`;
    if (direction === "left") return `translateX(${distance})`;
    if (direction === "right") return `translateX(-${distance})`;
    return direction === "scale" ? "scale(0.92)" : `translateY(${distance})`;
  })();

  return (
    <div
      ref={ref}
      className={`reveal-Elm ${revealed ? "revealed" : ""} ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
        animationName: revealed ? undefined : `polityra-fade-${direction}`,
        animationDuration: `${duration}ms`,
        animationFillMode: "both",
        transform: !revealed ? transformDir : undefined,
      }}
    >
      {children}
    </div>
  );
}

// Animated counter that counts up when scrolled into view
export function AnimatedCounter({
  end,
  duration = 2000,
  prefix = "",
  suffix = "",
  className = "",
}: {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting && !started) {
          setStarted(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, end, duration]);

  return (
    <span className={className}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// Floating particles for decorative backgrounds
export function FloatingParticles({ count = 20 }: { count?: number }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * -20,
    opacity: Math.random() * 0.3 + 0.05,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-30px) translateX(15px); }
          50% { transform: translateY(-10px) translateX(-20px); }
          75% { transform: translateY(20px) translateX(10px); }
        }
      `}</style>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-cyan-300/40"
          style={{
            width: p.size,
            height: p.size,
            left: p.left,
            top: p.top,
            opacity: p.opacity,
            animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
