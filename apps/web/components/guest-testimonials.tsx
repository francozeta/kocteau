"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

const GrainGradient = dynamic(
  () =>
    import("@paper-design/shaders-react").then((mod) => mod.GrainGradient),
  { ssr: false },
);

const testimonials = [
  {
    quote: "thanks for sharing, looks pretty good! saw it on Discord before :)",
    author: "OrcDev",
    handle: "@orcdev",
    avatarUrl: "/testimonials/orcdev.jpg",
    href: "https://x.com/orcdev/status/2062535164652113952",
  },
  {
    quote: "This is awesome😭, I am gonna use this for discovering music",
    author: "Aditya",
    handle: "@adityaseeks",
    avatarUrl: "/testimonials/adityaseeks.jpg",
    href: "https://x.com/adityaseeks/status/2060944077357822007",
  },
  {
    quote: "Esto me gusta, se ve super util",
    author: "precis0x",
    handle: "@precisox",
    avatarUrl: "/testimonials/precisox.jpg",
    href: "https://x.com/precisox/status/2059816726468960761",
  },
  {
    quote: "Great concept, clean UI, keep going!",
    author: "Ken",
    handle: "@kenrt_",
    avatarUrl: "/testimonials/kenrt.jpg",
    href: "https://x.com/kenrt_/status/2058325023824523704",
  },
  {
    quote:
      "A social app focused on music discovery and reviews sounds interesting, especially since people usually trust other listeners more than algorithms.",
    author: "Nez",
    handle: "@nezbuilds",
    avatarUrl: "/testimonials/nezbuilds.jpg",
    href: "https://x.com/nezbuilds/status/2058067723578421606",
  },
  {
    quote:
      "A modern social platform for music discovery feels super fresh. Let’s follow each other🤝",
    author: "Sourov Das",
    handle: "@Sourov099",
    avatarUrl: "/testimonials/sourov099.jpg",
    href: "https://x.com/Sourov099/status/2056969461853462739",
  },
] as const;

type TransitionPhase = "shown" | "hiding" | "preparing";

export default function GuestTestimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<TransitionPhase>("shown");
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTransitioning = phase !== "shown";
  const testimonial = testimonials[activeIndex];

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPrefersReducedMotion(query.matches);

    sync();
    query.addEventListener("change", sync);

    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    testimonials.forEach(({ avatarUrl }) => {
      const image = new window.Image();
      image.src = avatarUrl;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const showTestimonial = useCallback(
    (nextIndex: number) => {
      if (nextIndex === activeIndex || isTransitioning) return;

      if (prefersReducedMotion) {
        setActiveIndex(nextIndex);
        return;
      }

      setPhase("hiding");
      timeoutRef.current = setTimeout(() => {
        setActiveIndex(nextIndex);
        setPhase("preparing");

        requestAnimationFrame(() => {
          requestAnimationFrame(() => setPhase("shown"));
        });
      }, 200);
    },
    [activeIndex, isTransitioning, prefersReducedMotion],
  );

  useEffect(() => {
    if (isPaused || isTransitioning || prefersReducedMotion) return;

    const interval = window.setInterval(() => {
      showTestimonial((activeIndex + 1) % testimonials.length);
    }, 6_500);

    return () => window.clearInterval(interval);
  }, [activeIndex, isPaused, isTransitioning, prefersReducedMotion, showTestimonial]);

  const initials = testimonial.author
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <section
      aria-label="What listeners are saying about Kocteau"
      className="mx-auto w-full max-w-[80rem] px-4 sm:px-6 lg:px-10"
    >
      <a
        href={testimonial.href}
        target="_blank"
        rel="noreferrer"
        aria-label={`Read ${testimonial.author}'s post about Kocteau on X`}
        className="relative isolate mx-auto block min-h-[24rem] w-full max-w-[58rem] cursor-pointer overflow-hidden rounded-[1rem] bg-[#08090b] shadow-[0_0_0_1px_oklch(1_0_0/0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/55 sm:min-h-[25rem]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={() => setIsPaused(false)}
      >
        <div className="pointer-events-none absolute inset-0 opacity-72">
          <GrainGradient
            aria-hidden="true"
            colorBack="#070910"
            colors={["#9c4d78", "#48689a", "#b06b8c"]}
            fit="cover"
            frame={11_000}
            height="100%"
            intensity={0.22}
            maxPixelCount={850_000}
            minPixelRatio={1}
            noise={0.22}
            offsetY={0.18}
            scale={1.12}
            shape="wave"
            softness={0.78}
            speed={prefersReducedMotion ? 0 : 0.16}
            style={{ height: "100%", width: "100%" }}
            width="100%"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,6,9,0.38),rgba(8,9,14,0.08)_48%,rgba(5,6,9,0.46))]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,rgba(4,5,9,0.12)_62%,rgba(4,5,9,0.45)_100%)]" />

        <div className="pointer-events-none relative z-10 flex min-h-[24rem] flex-col items-center justify-center px-6 py-16 text-center sm:min-h-[25rem] sm:px-12">
          <div
            className={`t-stagger max-w-[40rem] ${phase === "shown" ? "is-shown" : ""} ${phase === "hiding" ? "is-hiding" : ""}`}
          >
            <blockquote className="t-stagger-line t-stagger-line--1 text-balance font-serif text-[clamp(1.35rem,3.1vw,2rem)] font-semibold leading-[1.15] tracking-[-0.025em] text-white/92">
              “{testimonial.quote}”
            </blockquote>
            <span className="t-stagger-line t-stagger-line--2 mx-auto mt-8 w-fit">
              <span className="flex items-center gap-2.5 text-start">
                <Avatar className="size-9 bg-white/[0.11] shadow-[0_0_0_1px_oklch(1_0_0/0.12)]">
                  {testimonial.avatarUrl ? (
                    <AvatarImage
                      src={testimonial.avatarUrl}
                      alt={testimonial.author}
                    />
                  ) : null}
                  <AvatarFallback className="bg-white/[0.08] text-[10px] font-semibold text-white/82">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span>
                  <span className="block text-[12px] font-semibold text-white/92">
                    {testimonial.author}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-white/52">
                    {testimonial.handle} · X
                  </span>
                </span>
              </span>
            </span>
          </div>
        </div>
      </a>
    </section>
  );
}
