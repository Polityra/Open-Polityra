/**
 * Animated hero background — minimal, black & white, pure CSS (no JS, no extra deps).
 *  - a fine grid that drifts one cell at a time (seamless loop), softly masked at the edges
 *  - three blurred grayscale glows that float slowly
 *  - a faint grain layer so the gradients feel less flat
 * Motion is disabled automatically for visitors with "reduce motion" enabled.
 *
 * Usage: place inside a `relative isolate overflow-hidden` section, before the content.
 */

const css = `
.hero-bg__grid-mask {
  position: absolute;
  inset: 0;
  -webkit-mask-image: radial-gradient(ellipse 75% 65% at 50% 38%, #000 25%, transparent 100%);
  mask-image: radial-gradient(ellipse 75% 65% at 50% 38%, #000 25%, transparent 100%);
}
.hero-bg__grid {
  position: absolute;
  inset: -64px;
  background-image:
    linear-gradient(to right, rgba(0,0,0,0.07) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0,0,0,0.07) 1px, transparent 1px);
  background-size: 64px 64px;
  animation: hero-grid-drift 28s linear infinite;
  will-change: transform;
}
.hero-bg__orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(70px);
  will-change: transform;
}
.hero-bg__orb--a {
  width: 38rem; height: 38rem;
  top: -10rem; left: -8rem;
  background: radial-gradient(circle, rgba(0,0,0,0.12), transparent 70%);
  animation: hero-float-a 24s ease-in-out infinite alternate;
}
.hero-bg__orb--b {
  width: 32rem; height: 32rem;
  top: 6rem; right: -9rem;
  background: radial-gradient(circle, rgba(0,0,0,0.09), transparent 70%);
  animation: hero-float-b 30s ease-in-out infinite alternate;
}
.hero-bg__orb--c {
  width: 26rem; height: 26rem;
  bottom: -6rem; left: 30%;
  background: radial-gradient(circle, rgba(0,0,0,0.07), transparent 70%);
  animation: hero-float-c 36s ease-in-out infinite alternate;
}
.hero-bg__grain {
  position: absolute;
  inset: 0;
  opacity: 0.05;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}
.hero-bg__fade {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 55%, #ffffff 100%);
}

@keyframes hero-grid-drift {
  from { transform: translate3d(0, 0, 0); }
  to   { transform: translate3d(64px, 64px, 0); }
}
@keyframes hero-float-a {
  from { transform: translate3d(0, 0, 0) scale(1); }
  to   { transform: translate3d(9rem, 6rem, 0) scale(1.15); }
}
@keyframes hero-float-b {
  from { transform: translate3d(0, 0, 0) scale(1.1); }
  to   { transform: translate3d(-8rem, 8rem, 0) scale(0.95); }
}
@keyframes hero-float-c {
  from { transform: translate3d(0, 0, 0) scale(1); }
  to   { transform: translate3d(-7rem, -5rem, 0) scale(1.2); }
}

@media (prefers-reduced-motion: reduce) {
  .hero-bg__grid,
  .hero-bg__orb { animation: none; }
}
`;

export default function HeroBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-20 overflow-hidden bg-white"
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="hero-bg__grid-mask">
        <div className="hero-bg__grid" />
      </div>
      <div className="hero-bg__orb hero-bg__orb--a" />
      <div className="hero-bg__orb hero-bg__orb--b" />
      <div className="hero-bg__orb hero-bg__orb--c" />
      <div className="hero-bg__grain" />
      <div className="hero-bg__fade" />
    </div>
  );
}
