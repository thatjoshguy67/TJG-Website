"use client";

import Image from "next/image";
import { Education } from "@thatjoshguy/oneui-icons";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import AnimatedText from "./AnimatedText";

export default function HomeHero({ environmentLabel, isCollege = false }: {
  environmentLabel: "Beta" | "Dev" | null;
  isCollege?: boolean;
}) {
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroLaunchReady, setHeroLaunchReady] = useState(false);

  useLayoutEffect(() => {
    const navigationEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (navigationEntry?.type === "reload" && !window.location.hash && window.scrollY > 0) {
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    let cancelled = false;
    let launchReady = false;
    let firstFrame = 0;
    let secondFrame = 0;
    let timeout = 0;
    const markHeroLaunchReady = () => {
      if (cancelled || launchReady) return;
      launchReady = true;
      window.clearTimeout(timeout);
      setHeroLaunchReady(true);
    };
    const images = Array.from(hero.querySelectorAll<HTMLImageElement>(".hero-mesh img"));
    const decoded = images.map(async (image) => {
      if (!image.complete) {
        await new Promise<void>((resolve) => {
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        });
      }

      if (typeof image.decode === "function") {
        await image.decode().catch(() => undefined);
      }
    });

    timeout = window.setTimeout(markHeroLaunchReady, 900);

    void Promise.all(decoded).then(() => {
      if (cancelled) return;

      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => {
          markHeroLaunchReady();
        });
      });
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, []);

  return (
    <>
  {/* Hero + Role Cards Layout */}
  <div
    ref={heroRef}
    className={`hero-role-wrapper${heroLaunchReady ? " hero-launch-ready" : ""}`}
  >
    {environmentLabel && (
      <span className="beta-chip hero-environment-chip">{isCollege ? `College ${environmentLabel}` : environmentLabel}</span>
    )}
    {/* Hero Section */}
    <div className="hero-section">
      <div className="hero-mesh" aria-hidden="true">
        <Image src="/images/home/hero/mesh-light-left.svg" alt="" width={1637} height={1603} className="hero-mesh-layer hero-mesh-light hero-mesh-light-left" preload />
        <Image src="/images/home/hero/mesh-light-center.svg" alt="" width={1637} height={1603} className="hero-mesh-layer hero-mesh-light hero-mesh-light-center" preload />
        <Image src="/images/home/hero/mesh-light-right.svg" alt="" width={1624} height={1716} className="hero-mesh-layer hero-mesh-light hero-mesh-light-right" preload />
        <Image src="/images/home/hero/mesh-dark-left.svg" alt="" width={1777} height={1743} className="hero-mesh-layer hero-mesh-dark hero-mesh-dark-left" preload />
        <Image src="/images/home/hero/mesh-dark-center.svg" alt="" width={1777} height={1743} className="hero-mesh-layer hero-mesh-dark hero-mesh-dark-center" preload />
        <Image src="/images/home/hero/mesh-dark-right.svg" alt="" width={1764} height={1856} className="hero-mesh-layer hero-mesh-dark hero-mesh-dark-right" preload />
      </div>
      <div className="hero-intro">
        {isCollege && (
          <span className="hero-college-icon" role="img" aria-label="College portfolio">
            <Education size={64} color="currentColor" aria-hidden="true" />
          </span>
        )}
        <span className="hero-subtitle">Hey, I&apos;m</span>
        <h1 className="hero-name">
          <AnimatedText text="Josh Skinner" className="hero-name-entrance" inverse />
        </h1>
        <div className="hero-description">
          <span>aka</span>
          <span className="hero-brand-mark" aria-hidden="true">
            <Image src="/images/home/hero/brand-light.svg" alt="" width={37} height={25} className="hero-theme-asset hero-theme-asset-light" />
            <Image src="/images/home/hero/brand-dark.svg" alt="" width={37} height={25} className="hero-theme-asset hero-theme-asset-dark" />
          </span>
          <span className="hero-alias">That Josh Guy</span>
        </div>
      </div>
      <a href="#about" className="hero-scroll-indicator" aria-label="Scroll to About">
        <Image src="/images/home/hero/arrow-light.svg" alt="" width={76} height={40} className="hero-scroll-arrow hero-theme-asset hero-theme-asset-light" />
        <Image src="/images/home/hero/arrow-dark.svg" alt="" width={76} height={40} className="hero-scroll-arrow hero-theme-asset hero-theme-asset-dark" />
      </a>
    </div>

  </div>
    </>
  );
}
