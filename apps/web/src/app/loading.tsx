import Image from "next/image";

export default function Loading() {
  return (
    <main
      role="status"
      aria-live="polite"
      className="flex min-h-screen flex-col items-center justify-center bg-[#000610]"
    >
      <Image
        src="/images/logo-transparent.png"
        alt="Open Polityra"
        width={1040}
        height={312}
        priority
        className="h-12 w-auto animate-pulse"
      />
      <div className="mt-8 h-0.5 w-40 overflow-hidden rounded bg-[#12306a]">
        <div className="h-full w-1/2 animate-[loadbar_1.2s_ease-in-out_infinite] bg-gradient-to-r from-[#1478fd] to-[#41cbfd]" />
      </div>
      <span className="sr-only">Loading…</span>
      <style>{`@keyframes loadbar{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}`}</style>
    </main>
  );
}
